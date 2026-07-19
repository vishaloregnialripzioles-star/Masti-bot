---
name: Discord Bot Architecture
description: Key decisions and gotchas for the Discord bot built in artifacts/discord-bot
---

## Structure
- Entry: `artifacts/discord-bot/src/index.ts`
- Run with tsx (no compile step) — command: `pnpm --filter @workspace/discord-bot run dev`
- Database imported directly via relative path to `lib/db` since the package can't be referenced as a composite lib from an artifact; paths alias `@workspace/db` set in tsconfig

## TypeScript Notes
- tsconfig has no `rootDir` to allow cross-package imports from `lib/db`
- tsconfig `include` explicitly includes `../../lib/db/src/**/*`
- Channel sends need `"send" in message.channel` guard due to `PartialGroupDMChannel`
- MessageDelete listener typed as `Message | PartialMessage`

## Key Design Decisions
- Prefix: `.` (dot)
- Snipe cache: in-memory Map with 5-min auto-expiry (no DB writes)
- XP cooldown: 60s per user per guild (in-memory Map)
- Economy cooldown: 60s per user per guild (in-memory Map)
- AFK pings stored as JSONB array in `afk_users` table
- Modmail: DMs to bot → relayed to staff channel; threads tracked in DB
- Blocked words cache: 60s TTL per guild (in-memory), invalidated on change
- Auto-escalation: 3 warnings = 1h timeout, 5 warnings = ban

**Why:** Keeping snipe/cooldown caches in memory avoids DB writes on every message while providing sufficient functionality. AFK in DB ensures persistence across bot restarts.

## Required Privileged Intents (discord.com/developers/applications)
- MESSAGE CONTENT INTENT (required for reading message text)
- SERVER MEMBERS INTENT (required for member fetching)
- PRESENCE INTENT (optional, for reaction roles)
