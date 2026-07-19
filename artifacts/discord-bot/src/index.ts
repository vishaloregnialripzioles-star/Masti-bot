import { Client, GatewayIntentBits, Partials } from "discord.js";
import { logger } from "./lib/logger.js";

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
