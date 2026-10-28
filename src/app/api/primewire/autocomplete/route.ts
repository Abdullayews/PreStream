import { NextRequest, NextResponse } from 'next/server';
import { autocomplete } from '@/lib/primewire';
import type { AutocompleteKind } from '@/lib/primewire/types';

export const dynamic = 'force-dynamic';

const KINDS: readonly AutocompleteKind[] = ['people', 'countries', 'services', 'companies'];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kindRaw = sp.get('kind') ?? sp.get('type') ?? '';
  if (!KINDS.includes(kindRaw as AutocompleteKind)) {
    return NextResponse.json(
      { error: 'kind must be people|countries|services|companies' },
      { status: 400 },
    );
  }
  const term = (sp.get('term') ?? '').slice(0, 60);
  if (!term.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await autocomplete(kindRaw as AutocompleteKind, term);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
