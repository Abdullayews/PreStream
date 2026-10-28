# PreStream — Rust rewrite

Every time machine gets built twice: first in the imagination, then in
brass. The TypeScript app on `main` is the present, and it keeps running.
This branch is the machine being assembled to replace it.

## The build

- `primewire-core` — the scraping client rebuilt on tokio + scraper:
  parsers, mirror failover, session handling. Same behavior, 1:1 — a
  hotter engine under the same hood.
- `frontend` — Leptos compiled to WASM. Same routes, same 40 themes.

No features added, none removed. The dials read the same; only the
machinery underneath changes.

## Status

Gears are being cut — parser ports are underway. Code lands here as soon
as the machine is presentable. Until then, the present lives on `main`.
