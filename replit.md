# Masti Bot — Discord Bot

A full-featured Discord bot with moderation, economy, XP leveling, reaction roles, modmail, AFK system, and more.

## Run & Operate

- `pnpm --filter @workspace/discord-bot run dev` — run the Discord bot (tsx watch mode)
- `pnpm --filter @workspace/db run push` — push DB schema changes
- Required env: `DATABASE_URL` (auto-managed), `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Discord: discord.js v14
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Run: tsx (no compile step needed)

## Where things live

- `artifacts/discord-bot/src/index.ts` — bot entry point
- `artifacts/discord-bot/src/commands/` — all commands by category
- `artifacts/discord-bot/src/events/` — Discord event handlers
- `artifacts/discord-bot/src/automod/` — spam/invite/emoji/caps filters
- `artifacts/discord-bot/src/tasks/` — background tasks (leaderboard)
- `lib/db/src/schema/` — all database tables

## Command Reference (prefix: `.`)

### Moderation
| Command | Description |
|---|---|
| `.warn @user [reason]` | Warn user — auto-escalates: 3 warns → 1h timeout, 5 warns → ban |
| `.warnings @user` | View user's warnings |
| `.clearwarnings @user` | Clear all warnings for a user |
| `.kick @user [reason]` | Kick member |
| `.ban @user [reason]` | Ban member |
| `.unban <userId> [reason]` | Unban by ID |
| `.mute @user <duration> [reason]` | Timeout (10s, 5m, 2h, 1d) |
| `.unmute @user` | Remove timeout |
| `.chatban @user [reason]` | Remove send-message permission |
| `.unchatban @user` | Restore send-message permission |
| `.purge <1-100> [@user]` | Bulk delete messages |
| `.snipe` | Show last deleted message |
| `.slowmode <duration\|0>` | Set channel slowmode |
| `.lock [reason]` | Lock channel |
| `.unlock [reason]` | Unlock channel |

### Utility
| Command | Description |
|---|---|
| `.setup <setting> <value>` | Configure bot (modmail, log, filters, etc.) |
| `.template create/list/delete/dm` | Manage DM templates |
| `.blockedword add/remove/list` | Manage blocked words (auto-delete + warn DM) |
| `.modmail setup #channel` | Set modmail relay channel |
| `.modmail close` | Close modmail thread |
| `.modmail reply <msg>` | Reply to modmail user |
| `.reactionrole add/remove/list` | Manage reaction roles |
| `.afk [message]` | Set AFK with optional message |
| `.userinfo [@user]` | View user info |
| `.serverinfo` | View server info |
| `.help [command]` | Command list |

### Economy
| Command | Description |
|---|---|
| `.balance [@user]` | Check wallet + bank |
| `.daily` | Claim 200 coins daily reward |
| `.deposit <amount\|all>` | Deposit to bank |
| `.withdraw <amount\|all>` | Withdraw from bank |
| `.give @user <amount>` | Transfer coins |
| `.gamble <amount\|all\|half>` | 50/50 coin gamble |
| `.slots <amount>` | Slot machine |
| `.flip <heads\|tails> <amount>` | Coin flip |
| `.shop [add/remove]` | Browse shop (admins can add items) |
| `.buy <id>` | Purchase shop item |
| `.pet adopt/feed/play/status/rename` | Digital pet system |

### Leveling
| Command | Description |
|---|---|
| `.rank [@user]` | View XP rank and level |
| `.leaderboard [xp\|coins\|start\|stop]` | Leaderboard (admins: start/stop auto-update) |
| `.setlevelrole <level> @role` | Set role reward for a level |
| `.removelevelrole <level>` | Remove level role |
| `.listlevelroles` | View all level roles |

## Setup Guide (first time in a server)

1. Invite the bot with all permissions
2. Run `.setup modmail #staff-channel` to enable modmail
3. Run `.setup log #mod-log` for a log channel
4. Run `.setup spamfilter on` to enable spam protection
5. Run `.blockedword add <word>` to add blocked words
6. Create a warn DM template: `.template create warn_dm ⚠️ You were warned in {server}: {reason}`
7. Create a blocked word DM template: `.template create blocked_word_dm 🚫 Your message in {server} was deleted for a blocked word.`
8. Run `.setlevelrole 5 @ActiveMember` to reward levels
9. Run `.setup leaderboardchannel #leaderboard` then `.leaderboard start`

## Auto-Moderation (all toggleable via `.setup`)

- **Spam filter** — removes messages if user sends 6+ in 5 seconds
- **Invite filter** — removes Discord invite links (bypassed by Manage Server)
- **Emoji filter** — removes messages with 10+ emojis
- **Caps filter** — removes messages that are 70%+ uppercase (10+ chars)
- **Blocked words** — deletes matching messages and DMs the user a warning

## Templates

Templates support these variables: `{user}`, `{reason}`, `{server}`, `{warnings}`

Special template names:
- `warn_dm` — sent when a user is warned
- `blocked_word_dm` — sent when a blocked word is deleted

## Architecture decisions

- tsx used for running TypeScript directly (no build step)
- In-memory snipe cache (5-min TTL) — fast, no DB writes for deleted messages
- Drizzle ORM with direct pool import from `lib/db`
- Automod runs before command parsing; blocked words always checked
- AFK pings stored in JSONB column for simple retrieval

## User preferences

_Populate as you build._

## Gotchas

- Bot needs `MESSAGE_CONTENT` intent enabled in Discord Developer Portal
- Bot needs `SERVER MEMBERS INTENT` enabled in Discord Developer Portal
- For reaction roles to work, enable `PRESENCE INTENT` too
- All three privileged intents must be enabled at discord.com/developers/applications
