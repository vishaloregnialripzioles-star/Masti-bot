import { Client, GatewayIntentBits, Partials } from "discord.js";
import { createServer } from "http";
import { logger } from "./lib/logger.js";

// ── HTTP health-check server (required for Render Web Service) ──────────────
const PORT = process.env.PORT ?? 3000;
const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", bot: client?.user?.tag ?? "connecting" }));
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>Masti Bot</title>
        <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#23272a;color:#fff}
        .card{text-align:center;padding:40px;background:#2c2f33;border-radius:16px;box-shadow:0 4px 20px #0008}
        h1{color:#7289da;margin-bottom:8px}span{color:#43b581;font-size:1.1em}</style>
        </head>
        <body><div class="card">
          <h1>🤖 Masti Bot</h1>
          <p><span>● Online</span></p>
          <p style="color:#99aab5">Discord bot is running. Prefix: <code style="background:#23272a;padding:2px 8px;border-radius:4px">.</code></p>
          <p style="color:#72767d;font-size:.85em">Keep this page pinged with UptimeRobot to stay awake 24/7</p>
        </div></body>
      </html>
    `);
  }
});

httpServer.listen(PORT, () => {
  logger.info(`Health-check server listening on port ${PORT}`);
});

// Register all events
import registerReady from "./events/ready.js";
import registerMessageCreate from "./events/messageCreate.js";
import registerMessageDelete from "./events/messageDelete.js";
import registerVoiceStateUpdate from "./events/voiceStateUpdate.js";
import registerInteractionCreate from "./events/interactionCreate.js";
import registerReactionAdd from "./events/reactionAdd.js";
import registerReactionRemove from "./events/reactionRemove.js";
import registerDmHandler from "./events/dmHandler.js";

// Validate environment
if (!process.env.DISCORD_TOKEN) {
  logger.error("DISCORD_TOKEN is not set!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

// Register all event handlers
registerReady(client);
registerDmHandler(client);
registerMessageCreate(client);
registerMessageDelete(client);
registerVoiceStateUpdate(client);
registerInteractionCreate(client);
registerReactionAdd(client);
registerReactionRemove(client);

// Leaderboard auto-update (every 10 minutes)
import { updateLeaderboards } from "./tasks/leaderboard.js";
setInterval(() => updateLeaderboards(client).catch((e) => logger.error("Leaderboard update error", e)), 10 * 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down...");
  client.destroy();
  process.exit(0);
});

// Login
logger.info("Connecting to Discord...");
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  logger.error("Failed to login:", err);
  process.exit(1);
});
