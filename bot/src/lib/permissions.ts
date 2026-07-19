import { GuildMember, PermissionFlagsBits } from "discord.js";

export function isModerator(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export function isOwner(member: GuildMember): boolean {
  return member.guild.ownerId === member.id;
}

export function canModerate(moderator: GuildMember, target: GuildMember): boolean {
  if (target.id === moderator.guild.ownerId) return false;
  if (moderator.roles.highest.position <= target.roles.highest.position) return false;
  return true;
}
