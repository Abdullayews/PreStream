/**
 * DNS-over-HTTPS resolver + undici lookup adapter (RFC 8484 wireformat).
 *
 *  - Endpoints are IP-literal HTTPS URLs, so the resolver itself never
 *    needs a DNS lookup.
 *  - Resolved addresses are never cached — every new upstream connection
 *    resolves fresh. (undici's connection pool still reuses open TCP/TLS
 *    connections per origin — that is connection reuse, not data caching.)
 *  - If the resolver is unreachable, falls back to the system resolver
 *    with a console.warn so the site stays up.
 *  - IP literals / localhost never go through DoH (nothing to resolve).
 */
import { Agent, fetch as undiciFetch, setGlobalDispatcher } from 'undici';
import * as dns from 'dns';
import * as net from 'net';

/** DoH endpoints — IP-literal so no bootstrap resolution is needed. */
const DOH_ENDPOINTS = ['https://9.9.9.9/dns-query', 'https://149.112.112.112/dns-query'];
const DOH_TIMEOUT_MS = 5000;

/**
 * The DoH endpoint requires HTTP/2 (RFC 8484 §5.2); undici defaults to
 * HTTP/1.1, so DoH requests go through this dedicated h2-enabled agent.
 * The endpoints are IP literals, so this agent itself never resolves DNS.
 */
const dohAgent = new Agent({ allowH2: true });

const QTYPE_A = 1;
const QTYPE_AAAA = 28;

/* ------------------------------------------------------------------ */
/* DNS wireformat (RFC 1035) — query builder + answer parser           */
/* ------------------------------------------------------------------ */

function buildQuery(name: string, qtype: number): Buffer {
  const labels = name.split('.').filter(Boolean);
  let qnameLen = 1; // terminating root label
  for (const label of labels) qnameLen += 1 + Buffer.byteLength(label, 'ascii');

  const buf = Buffer.alloc(12 + qnameLen + 4);
  let off = 0;
  buf.writeUInt16BE(Math.floor(Math.random() * 0x10000), off); off += 2; // ID
  buf.writeUInt16BE(0x0100, off); off += 2; // FLAGS: RD=1 (recursion desired)
  buf.writeUInt16BE(1, off); off += 2; // QDCOUNT
  buf.writeUInt16BE(0, off); off += 2; // ANCOUNT
  buf.writeUInt16BE(0, off); off += 2; // NSCOUNT
  buf.writeUInt16BE(0, off); off += 2; // ARCOUNT
  for (const label of labels) {
    const byteLen = Math.min(63, Buffer.byteLength(label, 'ascii'));
    buf.writeUInt8(byteLen, off); off += 1;
    off += buf.write(label, off, off + byteLen, 'ascii');
  }
  buf.writeUInt8(0, off); off += 1; // root label
  buf.writeUInt16BE(qtype, off); off += 2;
  buf.writeUInt16BE(1, off); off += 2; // QCLASS = IN
  return buf;
}

interface ParsedName {
  name: string;
  next: number;
}

/** Read a (possibly compressed) DNS name. Jumps are capped to avoid loops. */
function readName(buf: Buffer, start: number): ParsedName {
  const parts: string[] = [];
  let off = start;
  let jumps = 0;
  let next = -1;
  for (;;) {
    if (off >= buf.length) throw new Error('truncated name');
    const len = buf.readUInt8(off);
    if (len === 0) {
      off += 1;
      if (next === -1) next = off;
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      // compression pointer
      if (off + 1 >= buf.length) throw new Error('truncated pointer');
      if (next === -1) next = off + 2;
      off = ((len & 0x3f) << 8) | buf.readUInt8(off + 1);
      if (++jumps > 16) throw new Error('pointer loop');
      continue;
    }
    if (off + 1 + len > buf.length) throw new Error('truncated label');
    parts.push(buf.toString('ascii', off + 1, off + 1 + len));
    off += 1 + len;
  }
  return { name: parts.join('.'), next };
}

function formatIpv6(rdata: Buffer): string {
  const groups: string[] = [];
  for (let i = 0; i < 16; i += 2) {
    groups.push(((rdata[i] << 8) | rdata[i + 1]).toString(16));
  }
  return groups.join(':');
}

interface DohAnswer {
  address: string;
  family: number;
}

/** Parse the answer section of a DNS response into A/AAAA records. */
function parseAnswers(buf: Buffer): { rcode: number; answers: DohAnswer[] } {
  if (buf.length < 12) throw new Error('short response');
  const flags = buf.readUInt16BE(2);
  const rcode = flags & 0x000f;
  const qdcount = buf.readUInt16BE(4);
  const ancount = buf.readUInt16BE(6);

  let off = 12;
  for (let i = 0; i < qdcount; i++) {
    off = readName(buf, off).next + 4; // skip QTYPE + QCLASS
  }

  const answers: DohAnswer[] = [];
  for (let i = 0; i < ancount; i++) {
    off = readName(buf, off).next;
    if (off + 10 > buf.length) throw new Error('truncated answer');
    const rtype = buf.readUInt16BE(off);
    off += 2; // TYPE
    off += 2; // CLASS
    off += 4; // TTL
    const rdlen = buf.readUInt16BE(off);
    off += 2;
    if (off + rdlen > buf.length) throw new Error('truncated rdata');
    const rdata = buf.subarray(off, off + rdlen);
    if (rtype === QTYPE_A && rdlen === 4) {
      answers.push({ address: `${rdata[0]}.${rdata[1]}.${rdata[2]}.${rdata[3]}`, family: 4 });
    } else if (rtype === QTYPE_AAAA && rdlen === 16) {
      answers.push({ address: formatIpv6(rdata), family: 6 });
    }
    off += rdlen;
  }
  return { rcode, answers };
}

/** One query, tried against both endpoints. No caching. */
async function dohQuery(name: string, qtype: number): Promise<DohAnswer[]> {
  const wire = buildQuery(name, qtype);
  const dnsParam = wire.toString('base64url');

  let lastError: unknown = null;
  for (const endpoint of DOH_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS);
    try {
      const res = await undiciFetch(`${endpoint}?dns=${dnsParam}`, {
        method: 'GET',
        headers: { Accept: 'application/dns-message' },
        signal: controller.signal,
        dispatcher: dohAgent,
      });
      if (!res.ok) throw new Error(`DoH endpoint ${endpoint} responded ${res.status}`);
      const body = Buffer.from(await res.arrayBuffer());
      const { rcode, answers } = parseAnswers(body);
      if (rcode !== 0) throw new Error(`DoH rcode=${rcode} for ${name}`);
      return answers;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('DoH query failed');
}

/** Resolve a hostname (A first, AAAA fallback). Never cached. */
async function dohResolve(hostname: string, family: number): Promise<DohAnswer[]> {
  if (family === 6) return dohQuery(hostname, QTYPE_AAAA);
  const v4 = await dohQuery(hostname, QTYPE_A);
  if (v4.length > 0 || family === 4) return v4;
  return dohQuery(hostname, QTYPE_AAAA);
}

/* ------------------------------------------------------------------ */
/* undici lookup adapter (same contract as dns.lookup)                 */
/* ------------------------------------------------------------------ */

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | { address: string; family: number } | Array<{ address: string; family: number }>,
  family?: number,
) => void;

function systemLookupFallback(hostname: string, options: dns.LookupAllOptions, callback: LookupCallback, reason: string): void {
  console.warn(`[doh] falling back to system resolver for ${hostname}: ${reason}`);
  dns.lookup(hostname, options, (err, ...rest) => callback(err, ...(rest as [never])));
}

/**
 * undici-compatible `lookup`: routes every hostname through DoH.
 * IP literals and localhost pass straight to the system resolver (nothing
 * to resolve over DNS).
 */
export function dohLookup(
  hostname: string,
  options: dns.LookupAllOptions,
  callback: LookupCallback,
): void {
  if (net.isIP(hostname) !== 0 || hostname === 'localhost') {
    dns.lookup(hostname, options, (err, ...rest) => callback(err, ...(rest as [never])));
    return;
  }

  const wantFamily = options.family ?? 0;
  const t0 = Date.now();
  dohResolve(hostname, wantFamily)
    .then((answers) => {
      if (answers.length === 0) {
        systemLookupFallback(hostname, options, callback, 'no A/AAAA records');
        return;
      }
      console.log(`[doh] ${hostname} → ${answers.map((a) => a.address).join(', ')} (${Date.now() - t0}ms)`);
      if (options.all) {
        callback(null, answers.map((a) => ({ address: a.address, family: a.family })));
      } else {
        callback(null, answers[0].address, answers[0].family);
      }
    })
    .catch((err: unknown) => {
      systemLookupFallback(hostname, options, callback, err instanceof Error ? err.message : 'unknown');
    });
}

/**
 * Install the DoH-backed dispatcher as the global fetch dispatcher
 * (Next.js route handlers + libs use global fetch → undici). Every
 * outbound socket created after this resolves DNS through DoH.
 */
export function installResolver(): void {
  try {
    const agent = new Agent({
      connect: { lookup: dohLookup },
    });
    setGlobalDispatcher(agent);
    console.log('[doh] global fetch dispatcher installed');
  } catch (err) {
    console.error('[doh] failed to install dispatcher:', err);
  }
}
