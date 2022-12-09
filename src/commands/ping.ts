import { Discord, Slash, SlashOption } from "discordx";
import {
  CommandInteraction,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from "discord.js";

@Discord()
export class Testing2 {
  @Slash({ description: "Return a pong" })
  ping(interaction: CommandInteraction) {
    interaction.reply(`${interaction.user.username} pong`);
  }
}
