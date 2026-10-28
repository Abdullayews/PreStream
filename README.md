# PreStream — Rust rewrite

The TypeScript app on `main` works and stays the reference. This branch is
where the Rust port lands.

## Scope

- `primewire-core` — the scraping client (parsers, mirror failover, session
  handling) rebuilt on tokio + scraper, with 1:1 behavior parity
- `frontend` — Leptos compiled to WASM, same routes, same 40 themes

Same public API and the same embed providers. No feature changes: parity
first, then performance.

## Status

Early. Parser ports are underway; code gets pushed here as soon as it is
presentable.
