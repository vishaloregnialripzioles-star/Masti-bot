import { Events, type Client, type Interaction } from "discord.js";
import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { errorEmbed } from "../lib/embeds.js";

export default function registerInteractionCreate(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // Handle reaction role button interactions (future use)
    if (!interaction.isButton()) return;

    // Handle modmail reply buttons if needed
  });
}
