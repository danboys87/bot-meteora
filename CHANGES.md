# Changes

## v1.5 (2026-11-11)

- **PnL Calendar** (Wallet → PnL Calendar): kalender bulanan PnL realized per hari (hijau profit / merah rugi + jumlah trade), navigasi bulan, total bulanan. Reset harian 07:00 WIB = 00:00 UTC. Badge mode **DRY RUN** / **LIVE**. Endpoint `/api/pnl-calendar`, data dari history yang sama dengan halaman History.
- **Sub menu Live** (Wallet → Live): Dry run Pause/Resume, Tambah modal (dry run), dan kontrol Go Live (konfirmasi ganda tetap). Dihapus dari Settings dan tab atas.
- **TP Emergency default ON** (`EMERGENCY_TP_ENABLED=true`, +10%, aktif setelah harga turun 50% range bawah).
- **Default & tombol Reset = setting dev**: MAX_POSITIONS 10, POSITION_USDC 500, MIN_FT 0.6, MIN_BIN_STEP 80, MIN_AGE_H 0.5, MAX_PUMP1H 150%, MAX_PUMP_24H 500%.
- **Info filter Pump 1j/24j** di Settings: bot skip token yang sudah naik > MAX_PUMP1H (150%) dalam 1 jam atau > MAX_PUMP24H_PCT (200%) dalam 24 jam (anti beli di pucuk). Key lama `MAX_PUMP_24H` tidak dipakai filter.
- **Fix install baru**: `REAL_WALLET` dibaca dari `WALLET_PUBLIC_KEY` (kosong/invalid → alamat dummy), tidak crash "Invalid public key input".

## v1.3 (2026-11-11)

- **Stop Loss -20%** (`EMERGENCY_DROP=0.20`, net vs modal entry) dan **SL blacklist** (`SL_BLACKLIST_ENABLED=true`): token (mint) yang ditutup karena stop loss tidak dibuka lagi di pool/fee tier mana pun. Daftar tampil di Settings, dan bisa dihapus dengan konfirmasi + audit log.
- **Emergency TP** (default ON): posisi yang harganya turun ≥ `EMERGENCY_TP_TRIGGER_RANGE_PCT`% dari range bawah saat open memakai target TP `EMERGENCY_TP_PCT` (default 10%) menggantikan TP normal.
- **Close stale settings**: `STALE_CLOSE_ENABLED`, `MAX_HOURS`, `STALE_EXIT_MODE` (ANY / MINUS / BEP / PROFIT), `STALE_EXIT_PCT`. Default ANY = perilaku lama (tutup langsung setelah MAX_HOURS). Dikelompokkan dalam blok "Close stale".
- **History**: badge alasan close (SL, TP, TP EMERGENCY, OOR, TRAIL, MANUAL, **STALE**), durasi open di setiap baris (⏱), detail stale. Close yang terjadi setelah cutoff arsip lama selalu tampil di history.
- **Shape Spot:Bid-Ask**: input dua kotak `[ ] : [ ]` (angka bulat 0–100, jumlah 100, kotak lain terisi otomatis) untuk open dan compound.
- **Label Stop Loss** dan peringatan checklist saat menyalakan trailing stop. Label trailing ditebalkan.
- **UI**: tema kartu gelap yang seragam untuk semua halaman mini app.
- Teks HawkFi dihapus. Sumber screening ditampilkan sebagai Meteora datapi 30m.
- **Test isolation**: settings yang disimpan ke folder paper selain default (misalnya tes) tidak lagi menulis `.env` di folder bot utama.

## 2026-11-11 (afternoon, Asia/Jakarta) — v1.2: Emergency TP, Stop Loss label, trailing warning

- **Emergency TP (new, default OFF):** `EMERGENCY_TP_ENABLED=false`, `EMERGENCY_TP_TRIGGER_RANGE_PCT=50`, `EMERGENCY_TP_PCT=10`. When the active price falls from the leg's entry by at least (lower range at open × trigger %), e.g. range -50% → -25%, range -70% → -35%, the position is flagged `deepDrawdown` persistently (state keeps `openRangeDownPct`, `maxPriceDropPct`, `deepDrawdownAt/Bin/DropPct/TriggerPct`). While enabled, its TP target becomes `EMERGENCY_TP_PCT` (same net capital-asset basis and quote/fallback rules as normal TP). Close reason `emergency_tp …`. Applies live to open positions; Stop Loss -30% still has priority. Shown in Settings > Strategy with confirm + audit log.
- **Stop Loss label:** existing `EMERGENCY_DROP` now labelled "Stop Loss (emergency) %" and placed after TP.
- **Trailing stop:** TRAIL_* labels bold ("TRAILING STOP"); turning trailing ON requires a checkbox confirmation dialog. Default stays OFF.
- Tests: `test-emergency-tp.js` (13 offline checks). Version label bumped to v1.2 (README, package.json, mini app header, Telegram /start text).
- **Stop Loss -30% → -20%** (Tuan request t204): active setting and code defaults now `EMERGENCY_DROP=0.20`. Open positions keep the SL frozen in their entry snapshot (30%); new positions use 20%.
- **History recalc** (approved): all closed positions replayed from bot.log monitor polls under SL -20% / EMERGENCY_TP +10% / TP +20%, first event wins. Only HOLD-SOL changed (correction `hold-sol-20261111-emergency-tp-recalc-v2`: -180.04 → +49.99 USDC, EMERGENCY_TP at 12:52:08 WIB). GTA6-SOL (20:34 WIB 10 Nov) left unchanged: only 1 monitor poll in bot.log.
- Paper only. STOP left in place.

## 2026-11-10 (evening, Asia/Jakarta) — MIN_FT 2% → 1%

Tuan lowered the paper 30m fee/TVL threshold from 2% to **1%**. Default and `paper/settings.json` are both `MIN_FT=1`. TVL floor stays $10k; other anti-rug filters and the 5%-of-TVL cap are unchanged. The change is in `settings-audit.log` and a `[DRY RUN]` Telegram settings note was sent. Applies on the next paper scan. Live was not started. `/workspace/lp-bot/STOP` was left in place.


## 2026-11-10 (evening, Asia/Jakarta) — MIN_LIQ_USD 25000 → 10000

Tuan lowered the paper TVL floor from $25k to **$10k**. Default and `paper/settings.json` are both `MIN_LIQ_USD=10000`. Other anti-rug filters and the 5%-of-TVL position cap are unchanged. The change is in `settings-audit.log` and a `[DRY RUN]` Telegram settings note was sent. Applies on the next paper scan (`applyPaperSettings`). Live was not started. `/workspace/lp-bot/STOP` was left in place.


## 2026-11-10 (evening, Asia/Jakarta) — Mini app public tunnel, BIN SHAPE chart, sendPhoto

Cloudflared (2026.10.7) is installed at `~/.local/bin/cloudflared`. pm2 app `lp-tunnel` runs a quick tunnel to `127.0.0.1:8787`. A watcher writes `paper/tunnel-url.json` and, on every URL change, calls `setChatMenuButton` (web_app) for chat <ID_TELEGRAM> and `setMyCommands` `/start`. `/start` replies with a web_app button only to Tuan. The Status tab shows a per-position BIN SHAPE chart (SOL vs token per bin, active marker, range edges, M badge after reshape) only when a position is open. Open/reshape notifications send that chart as a PNG via `sendPhoto` (caption + Meteora / LP Agent buttons) and fall back to text. Local synthetic PNG tests were run; no fake trade notification was sent to Tuan. Token and keys stay out of pm2 dump and logs. `/workspace/lp-bot/STOP` was left in place. Live was not started.


## 2026-11-10 — Mini app Wallet + Live tabs (Tuan-triggered only)

Tuan now has a **Wallet** tab and a **Live** tab in the mini app, in addition to Status and Settings.

Wallet: hidden password field to paste a base58 or JSON-array private key. Write-only — the secret is never returned, displayed, logged, put in Telegram, or written to pm2 env/dump. The server validates the format and shows only the derived public address. The key is stored AES-256-GCM at rest, using a random master key under `/home/box/.secrets` (dir 700, files 600), outside the repo. Hapus key / Ganti key are provided. Live mode loads the key from this store into memory only (`SOLANA_BOT_PRIVATE_KEY` remains a fallback).

Live: shows address, SOL/USDC (RPC read), and a two-step Go Live (button, then type `LIVE` within 60s). Requirements: key stored, balance check (min 0.05 SOL fee reserve + 10 USDC), fresh initData (<5 min) for user <ID_TELEGRAM>, CSRF. Going live removes `/workspace/lp-bot/STOP` and starts pm2 `lp-live` with `DRY_RUN=0 LIVE_CONFIRMED=1`, same N5 strategy + settings.json + USDC flow (real Jupiter swaps; a 0.05 SOL fee reserve is kept on close). Paper is paused. Stop Live can write STOP and stop the app (close positions) or set `NO_NEW` (no new opens). Every key/live action is audited (no secrets) and sent as a Telegram note.

This agent did **not** go live, did **not** store a real key, and did **not** remove STOP. Only Tuan can trigger Go Live from the app.

POSTs stay rate-limited with CSRF and lock out after repeated bad auth. Tests cover unauthorized key/live writes and assert the secret never appears in responses, audit logs, or notify payloads (throwaway keypairs, deleted afterwards).


## 2026-11-10 — Mini app Settings tab (paper only)

Telegram mini app (`/workspace/lp-bot/miniapp`, pm2 `lp-miniapp`, localhost `127.0.0.1:8787`) now has a **Settings** tab in addition to a read-only Status tab. This is the only write path: it overrides the earlier "no write endpoints" rule solely for these paper settings: `MIN_FT`, `MIN_LIQ_USD`, `MIN_AGE_H`, reshape N, TP, emergency stop, close-after hours, `GAS_BUFFER_SOL`, and max pump / volume-spike filters, plus Pause/Resume of the dry run (`paper/STOP` only; `lp-paper` is restarted on resume with a clean env).

POST endpoints require valid Telegram `initData` HMAC for user `<ID_TELEGRAM>` plus a fresh single-use CSRF nonce (~10 minutes). Server-side type and min/max checks reject unknown or live-related keys (no `DRY_RUN` / `LIVE_CONFIRMED` toggle, no live STOP removal, no key, no wallet/funding/withdraw, no position size above the 500 USDC capital). Values are stored in `paper/settings.json`; `bot.js` reloads them on the next scan. Every change is appended with a WIB timestamp to `paper/settings-audit.log` and sent as a `[DRY RUN]` Telegram note. The UI shows current values vs defaults and has reset-to-default. Tests in `test-paper-settings.js` cover invalid and unauthorized writes. Live STOP is never touched.


## 2026-11-10 — Paper capital is 500 USDC only (no separate SOL gas wallet)

Paper virtual book starts at 500 USDC. There is no separate $10 SOL gas balance. At each open the bot Jupiter-quotes (quote only, no sign/send) USDC→SOL for the position size plus a configurable `GAS_BUFFER_SOL` extra (default **0.30 SOL**). The default is a floor above the computed need: position+ATA rent (~0.0594 SOL, refunded on close), up to two bin-array rents (~0.1429 SOL, typically not refunded), and a generous open/reshape/close/swap tx budget, then ×1.15 margin (~0.235 SOL needed). 0.30 SOL leaves headroom; if a pool quotes more arrays the buffer rises above the floor. 5% TVL cap still applies to position size, not the gas extra. A tiny USDC residual (`USDC_BUFFER`, default $0.10) stays unsold.

On close: token→SOL as before, refundable rent is returned, leftover gas buffer is included, and **all remaining SOL is swapped back to USDC**. PnL is USDC-primary (`usdc_in`, `usdc_out`, `pnl_usd`, `pnl_pct`) with SOL equivalent and `swap_cost_usd` / `gas_used_sol` listed separately. The 7-day paper window is unchanged (ends 2026-11-17 11:33:32 WIB). History was empty so the book was reset to 500 USDC. Paper only; live STOP left in place.

(2026-11-10)

Backup of the previous bot lives in `/workspace/lp-bot/backup-20261110/`. Live `state.json` history (Bitcoin-SOL) was not deleted.

## Fixes and hardening

- Hard live guard: refuses to start or `send()` unless `DRY_RUN=0` **and** `LIVE_CONFIRMED=1`. Paper mode forces `DRY_RUN=1` and never loads the private key.
- `run.sh` has the same guard and will not start live if `STOP` exists. Default is still `DRY_RUN=1`.
- HTTP and RPC calls retry with backoff; GeckoTerminal pump has a DexScreener fallback. Meteora `dlmm-api.meteora.ag` is 404; the bot uses `https://dlmm.datapi.meteora.ag/pools` (list + per-pool), which works.
- `status.json` refreshes the **on-chain** wallet balance (read-only) and, when paper is running, points at the paper journal. Live trade history is not overwritten.
- Insufficient-balance guard uses the **virtual** wallet in paper (real wallet is 0 SOL). Live still refuses to open if on-chain SOL < position + reserve + rent + buffer, and logs the numbers.
- Net PnL on paper close splits: fees earned, IL (mark inventory vs deposit), swap-back cost (Jupiter **quote only**), network fees (estimated), refundable rent (returned, not profit), non-refundable bin-array rent (cost).
- Position size can be `POSITION_SOL` or `POSITION_USD` (converted at entry). Capped at `MAX_POS_TVL_FRAC` (default 5% of pool TVL); both requested and actual sizes are logged.
- Min liquidity filter is `MIN_LIQ_USD` (default $10,000, was $3,000).
- Mint/freeze authority check stays on. Top-10 holder filter is optional (`CHECK_TOP_HOLDERS=1`), default off; uses `getTokenLargestAccounts` when enabled.

## Paper book

- `PAPER=1` writes a 7-day virtual book under `/workspace/lp-bot/paper/`.
- One position at a time, same C2 entry/exit rules, 5-minute poll, supervisor restarts on crash, auto-stop at the end of the window (or `paper/STOP`).
- Live `/workspace/lp-bot/STOP` is ignored in paper mode and was **not** removed.

## Same-position M-reshape (paper, and live if `RESHAPE=1`)

- Never opens a second position.
- Withdraws only token-side bins (`binId > active`). Left quote liquidity is never withdrawn.
- Re-adds those tokens as Bid-Ask on the right of active (SDK Bid-Ask is heavier at the far edge).
- If the target right edge is outside the position, uses `increasePositionLength(position, ResizeSide.Upper, length, funder)` (chunked, max 91 bins per call, position max 1400). If there is no room, the range is clamped and logged.
- Claimed SOL fees are compounded as an add to the left (Spot+Bid-Ask on bins below active), with no removal. May extend Lower if there is no left side left.
- Build-only SDK validation: open tx1 is constructed and not signed; reshape parameters and `quoteExtendPosition` are verified; `removeLiquidity` / `addLiquidityByStrategy` cannot be fully built until a real on-chain position exists (logged as such).


## 2026-11-10 (later) — shadow variants

- Reshape trigger is now: price/active bin dropped **N bins** since last reshape or entry (replaces 5% token value + 600s cooldown).
- Paper runs five shadow books in one process on a shared entry stream: baseline (no reshape, no compound), N=5/10/15/20 (M-reshape + compound-on-reshape, same-position rules).
- Exits evaluated per variant. Journals split per variant plus a comparison table in `summary.json`.
- Paper window end time kept at 17 Nov 2026 11:33:32 WIB.


## 2026-11-10 (afternoon, Asia/Jakarta) — anti-rug filters on the paper run

Backup: `/workspace/lp-bot/backup-20261110/bot.js.before-antirug`. Paper window, history, and `/workspace/lp-bot/STOP` were left in place. Live was not started.

- Default floors tightened: pool age ≥ 24h (was 6h), TVL ≥ $50k (was $10k).
- New entry rejects: 24h pump > +50%; 1h volume > 50% of 24h volume (or 24h volume missing while 1h is positive); RugCheck report with mint/freeze authority still set, `danger` risks, rugged flag, or normalised score ≥ 50. RugCheck HTTP/parse failure rejects the pool (fail-closed) and is logged.
- Holder concentration always on: top 10 holders excluding LP/pool/known program accounts must be ≤ 30% of supply; creator/dev ≤ 10%. Prefers RugCheck `topHolders`; RPC `getTokenLargestAccounts` is the fallback, also fail-closed if unknown.
- Emergency stop on every variant, including baseline: close when price is down more than 30% from entry. History reason is `emergency_stop`.
- All of the thresholds above are configurable constants / env vars. Existing C2 fee/TVL, 1h pump, bin-step, mint RPC, and 5% TVL cap checks stay in place.


## 2026-11-10 (afternoon, Asia/Jakarta) — paper min TVL $25k

Tuan approved lowering the paper-bot TVL floor from $50k to **$25,000**. All other anti-rug filters and the −30% emergency stop are unchanged. `/workspace/lp-bot/STOP` was left in place; live was not started. Paper window and history were preserved.


## 2026-11-10 (afternoon, Asia/Jakarta) — paper min 1h fee/TVL 1.5%

Tuan approved lowering the paper-bot 1h fee/TVL floor from 2% to **1.5%**. TVL stays $25k; the other anti-rug filters and the −30% emergency stop are unchanged. `/workspace/lp-bot/STOP` was left in place; live was not started. Paper window and history were preserved.


## 2026-11-10 (evening, Asia/Jakarta) — Meteora 30m fee/TVL ≥ 2%

Tuan chose the screenshot definition: **30-minute fees / current TVL** from Meteora datapi (`fee_tvl_ratio['30m']` = `fees['30m']/tvl*100`), threshold **≥ 2%**. The previous 1h fee/TVL entry filter is replaced. Configurable via `FT_WINDOW` (default `30m`) and `MIN_FT` (default `2`). TVL stays $25k; age 24h, 1h/24h pump, volume spike, RugCheck, holders, −30% emergency stop, and the 5% TVL cap are unchanged. Screening metric is replicated from Meteora datapi. Execution stays Meteora-only, paper only.

Backup: `/workspace/lp-bot/backup-20261110/bot.js.before-fee30m`. Paper window, history, and `/workspace/lp-bot/STOP` were left in place. Live was not started.


## 2026-11-10 (evening, Asia/Jakarta) — final paper strategy N5 + pm2

Tuan approved the final paper strategy: **30m fee/TVL ≥ 2%**, reshape every **5 bins (N5)** with compound, TVL ≥ $25k, age ≥ 24h, 1h/24h pump, volume spike, RugCheck, holders, −30% emergency stop, 5% TVL cap, 5 SOL/position, TP +20%, 12h close. Paper behaves like a single live book: `VARIANTS` is N5 only; baseline and N10 remain commented in `bot.js`, not deleted.

The process is supervised by **pm2** (`lp-paper`, `ecosystem.paper.config.js` + `paper-exec.sh`). The wrapper reinstalls dependencies with `npm ci` (fallback `npm install`) if `node_modules` is missing, and stops the pm2 app when `paper/STOP` or `paper/ENDED` is present so autorestart does not loop. No private key is in the pm2 env or config.

Backup: `/workspace/lp-bot/backup-20261110/bot.js.before-n5-only`. Paper window, empty history files, and `/workspace/lp-bot/STOP` were left in place. Live was not started.


## 2026-11-10 (evening, Asia/Jakarta) — Telegram dry-run notifier

Paper bot notifies Tuan on Telegram (casual Indonesian, tagged [DRY RUN]) for open, reshape, close, emergency stop, errors/restarts, daily summary ~21:00 WIB, and window end. Fail-safe and rate-limited; a notify failure never crashes the bot. Chat id is stored in `paper/telegram.json`. The bot token is read at runtime from a chmod 600 file outside the repo (or from the process env if present), is never written into the pm2 ecosystem file, dump, logs, or repo, and is unset in the pm2 wrapper env. Live was not started. `/workspace/lp-bot/STOP` was left in place.


## 2026-11-10 (evening, Asia/Jakarta) — Telegram Meteora + LP Agent buttons, Tuan-only

Open/reshape/close (and emergency) Telegram notices include inline URL buttons: **Meteora** (`https://app.meteora.ag/dlmm/<pool>`) and **LP Agent** (`https://app.lpagent.io/portfolio?address=<WALLET>&chain=SOL`, `LPAGENT_ADDRESS` defaulting to the bot wallet). Paper messages note that dry-run positions do not appear on LP Agent. Buttons are plain URLs, not Telegram Web Apps. Notifications go only to allowlisted chat `<ID_TELEGRAM>`; other user IDs are ignored if any update/mini-app path is used. Token still not stored in the repo or pm2 dump. Live was not started.
