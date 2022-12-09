import { Discord, Slash, SlashOption } from "discordx";
import { CommandInteraction, ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";

@Discord()
export class Testing {
  @Slash({ description: "Test command" })
  testing(
    @SlashOption({
      description: "Return a test message",
      name: "test",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    test: string,
    interaction: CommandInteraction
  ) {
    interaction.reply(`You said ${test}`);
  }

  

    
}
