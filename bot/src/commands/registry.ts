import { Collection } from "discord.js";
import type { Command } from "./types.js";

// Moderation
import warnCmd from "./moderation/warn.js";
import warningsCmd from "./moderation/warnings.js";
import clearwarningsCmd from "./moderation/clearwarnings.js";
import kickCmd from "./moderation/kick.js";
import banCmd from "./moderation/ban.js";
import unbanCmd from "./moderation/unban.js";
import muteCmd from "./moderation/mute.js";
import unmuteCmd from "./moderation/unmute.js";
import chatbanCmd from "./moderation/chatban.js";
import unchatbanCmd from "./moderation/unchatban.js";
import purgeCmd from "./moderation/purge.js";
import snipeCmd from "./moderation/snipe.js";
import slowmodeCmd from "./moderation/slowmode.js";
import lockCmd from "./moderation/lock.js";
import unlockCmd from "./moderation/unlock.js";

// Utility
import templateCmd from "./utility/template.js";
import blockedwordCmd from "./utility/blockedword.js";
import modmailCmd from "./utility/modmail.js";
import reactionroleCmd from "./utility/reactionrole.js";
import afkCmd from "./utility/afk.js";
import setupCmd from "./utility/setup.js";
import helpCmd from "./utility/help.js";
import userInfoCmd from "./utility/userinfo.js";
import serverInfoCmd from "./utility/serverinfo.js";

// Economy
import balanceCmd from "./economy/balance.js";
import dailyCmd from "./economy/daily.js";
import gambleCmd from "./economy/gamble.js";
import giveCmd from "./economy/give.js";
import shopCmd from "./economy/shop.js";
import buyCmd from "./economy/buy.js";
import petCmd from "./economy/pet.js";
import depositCmd from "./economy/deposit.js";
import withdrawCmd from "./economy/withdraw.js";
import slotsCmd from "./economy/slots.js";
import flipCmd from "./economy/flip.js";

// Leveling
import rankCmd from "./leveling/rank.js";
import leaderboardCmd from "./leveling/leaderboard.js";
import setlevelroleCmd from "./leveling/setlevelrole.js";
import removelevelroleCmd from "./leveling/removelevelrole.js";
import listlevelrolesCmd from "./leveling/listlevelroles.js";

export const commands = new Collection<string, Command>();

const allCommands: Command[] = [
  // Moderation
  warnCmd, warningsCmd, clearwarningsCmd,
  kickCmd, banCmd, unbanCmd,
  muteCmd, unmuteCmd,
  chatbanCmd, unchatbanCmd,
  purgeCmd, snipeCmd,
  slowmodeCmd, lockCmd, unlockCmd,
  // Utility
  templateCmd, blockedwordCmd, modmailCmd,
  reactionroleCmd, afkCmd, setupCmd,
  helpCmd, userInfoCmd, serverInfoCmd,
  // Economy
  balanceCmd, dailyCmd, gambleCmd,
  giveCmd, shopCmd, buyCmd,
  petCmd, depositCmd, withdrawCmd,
  slotsCmd, flipCmd,
  // Leveling
  rankCmd, leaderboardCmd,
  setlevelroleCmd, removelevelroleCmd, listlevelrolesCmd,
];

for (const cmd of allCommands) {
  commands.set(cmd.name, cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias, cmd);
    }
  }
}

export default commands;
