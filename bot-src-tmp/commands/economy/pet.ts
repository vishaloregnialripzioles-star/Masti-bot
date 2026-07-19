import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS, ECONOMY_CONFIG } from "../../config.js";
import { getOrCreateEconomy, removeCoins } from "../../lib/economy.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const PET_TYPES = ["🐱 cat", "🐶 dog", "🐹 hamster", "🐰 bunny", "🦊 fox", "🐸 frog"];

function getPetEmoji(type: string): string {
  return type.split(" ")[0] ?? "🐾";
}

const pet: Command = {
  name: "pet",
  aliases: ["mypet"],
  description: "Interact with your digital pet! Subcommands: adopt, feed, play, status, rename",
  usage: ".pet <adopt|feed|play|status|rename> [args]",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const sub = args[0]?.toLowerCase() ?? "status";
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);

    if (sub === "adopt") {
      if (eco.petName) return void message.reply({ embeds: [errorEmbed("Already Have a Pet", `You already have **${eco.petName}**! Use \`.pet status\`.`)] });
      const typeIndex = parseInt(args[1] ?? "0");
      const petType = PET_TYPES[typeIndex]?.split(" ")[1] ?? "cat";
      const name = args[2] ?? "Buddy";

      await db.update(schema.userEconomy)
        .set({ petName: name, petType, petLevel: 1, petHunger: 100, petHappiness: 100, petLastFedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

      const types = PET_TYPES.map((t, i) => `\`${i}\` ${t}`).join(", ");
      return void message.reply({ embeds: [successEmbed("Pet Adopted!", `You adopted a **${petType}** named **${name}**! 🎉\n\nRemember to feed it with \`.pet feed\`.`)] });
    }

    if (!eco.petName) {
      const types = PET_TYPES.map((t, i) => `\`${i}\` ${t}`).join(", ");
      return void message.reply({ embeds: [errorEmbed("No Pet", `Adopt a pet with \`.pet adopt <type> <name>\`\n\nTypes: ${types}`)] });
    }

    const petEmoji = getPetEmoji(eco.petType ?? "cat");

    if (sub === "feed") {
      if (eco.coins < ECONOMY_CONFIG.petFeedCost) {
        return void message.reply({ embeds: [errorEmbed("Not Enough Coins", `Feeding costs 🪙 ${ECONOMY_CONFIG.petFeedCost} coins.`)] });
      }
      await removeCoins(message.guild.id, message.author.id, ECONOMY_CONFIG.petFeedCost);
      const newHunger = Math.min(100, (eco.petHunger ?? 0) + 40);
      await db.update(schema.userEconomy)
        .set({ petHunger: newHunger, petLastFedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));
      return void message.reply({ embeds: [successEmbed("Pet Fed", `${petEmoji} **${eco.petName}** enjoyed the meal! Hunger: ${newHunger}/100`)] });
    }

    if (sub === "play") {
      const newHappiness = Math.min(100, (eco.petHappiness ?? 0) + 20);
      await db.update(schema.userEconomy)
        .set({ petHappiness: newHappiness, updatedAt: new Date() })
        .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));
      return void message.reply({ embeds: [successEmbed("Played!", `${petEmoji} **${eco.petName}** had a great time! Happiness: ${newHappiness}/100`)] });
    }

    if (sub === "rename") {
      const newName = args.slice(1).join(" ");
      if (!newName) return void message.reply({ embeds: [errorEmbed("Missing Name")] });
      await db.update(schema.userEconomy).set({ petName: newName, updatedAt: new Date() }).where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));
      return void message.reply({ embeds: [successEmbed("Renamed", `Your pet is now named **${newName}**!`)] });
    }

    // status
    const hungerBar = "🟩".repeat(Math.floor((eco.petHunger ?? 0) / 10)) + "⬛".repeat(10 - Math.floor((eco.petHunger ?? 0) / 10));
    const happyBar = "💙".repeat(Math.floor((eco.petHappiness ?? 0) / 10)) + "⬛".repeat(10 - Math.floor((eco.petHappiness ?? 0) / 10));
    const embed = new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle(`${petEmoji} ${eco.petName}`)
      .addFields(
        { name: "Type", value: eco.petType ?? "cat", inline: true },
        { name: "Level", value: String(eco.petLevel ?? 1), inline: true },
        { name: "🍗 Hunger", value: `${hungerBar} ${eco.petHunger}/100`, inline: false },
        { name: "💙 Happiness", value: `${happyBar} ${eco.petHappiness}/100`, inline: false },
      );
    await message.reply({ embeds: [embed] });
  },
};

export default pet;
