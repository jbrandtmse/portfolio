# Epic 7 — live deploy smoke (joshuabrandt.abacusai.cloud)

**Date:** 2026-06-10 · **Method:** `scripts/deploy.sh` (git pull → pnpm install → build api → build content+web → restart portfolio-api → reload nginx) then live curl + chrome-devtools against production · **Result: PASS**

Deployed `feature/PORT-1_portfolio-site` @ `fdefa09` (all of Epic 7). Build: 23 pages incl. the new `/technical/`, `/creative/`, `/agentic/` Wings + `/work/{vector-wars,christmas-elves,voyager}/`.

## Live verification (production)

| Check | Result |
| --- | --- |
| Routes 200 — `/`, `/technical/`, `/creative/`, `/agentic/`, `/work/{vector-wars,christmas-elves,voyager}/`, `/browse/` | ✅ all 200 |
| Home **featured-work** section live (id + the 4 grounded items: loandemo, portfolio, guide, music) | ✅ |
| **Technical Wing complete** — loandemo + Vector Wars + Voyager all live (screenshot) | ✅ live-epic7-technical-wing.png |
| Vendored playable bundles served — `/playables/vector-wars/`, `/playables/christmas-elves/` | ✅ 200 |
| **Voyager** hostname live + embedded — `https://voyager.abacusai.cloud/` | ✅ 200 |
| **Live christmas-elves PLAYS** — NFR-1 lazy (no iframe before activation); on activate the Phaser game boots a `<canvas>` in the iframe on production | ✅ `canvasBootsLive: true` |
| **Live Guide answers** (api restarted) — `/api/guide` grounded query | ✅ TTFT 1899ms / total 3460ms / 3 citations / **no FALLBACK_DEGRADED** |

## Conclusion

Epic 7 is **live in production**: the three Wings, the relevance-ordered home featured-work, and all three playable games (vector-wars + christmas-elves vendored; voyager embedded from its dedicated origin-root hostname). The Guide answers; christmas-elves plays live. FR-24/25/26 delivered and deployed.
