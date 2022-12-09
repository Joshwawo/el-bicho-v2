import { Discord, Slash, SlashOption } from "discordx";
import {
  CommandInteraction,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from "discord.js";

@Discord()
export class Testing2 {
  @Slash({ description: "Return a pong" })
  ga(
    @SlashOption({
      description: "Return a test message",
      name: "ping",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    test: string,
    interaction: CommandInteraction
  ) {
    interaction.reply(`${interaction.user.username} You said ${test}`);
  }
}
