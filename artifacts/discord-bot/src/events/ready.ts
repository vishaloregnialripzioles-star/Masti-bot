import { Events, type Client, ActivityType } from "discord.js";
import { logger } from "../lib/logger.js";

export default function registerReady(client: Client) {
  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`✅ Bot is online as ${readyClient.user.tag}`);
    logger.info(`📊 Serving ${readyClient.guilds.cache.size} guild(s)`);

    readyClient.user.setPresence({
      activities: [{ name: "Use . for commands | .help", type: ActivityType.Watching }],
      status: "online",
    });
  });
}
