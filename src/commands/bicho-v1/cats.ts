import { Discord, Slash, SlashOption } from "discordx";
import {
  CommandInteraction,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from "discord.js";
import axios from "axios";

@Discord()
export class Testing2 {
  @Slash({ description: "Return a cats images", name: "cats" })
  async cats(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {
        const url = `https://aws.random.cat/meow`;
        const { data:{file} } = await axios.get(url);
        console.log(file);
        
        await interaction.followUp(`${file}`);

        // const url = "https://api.thecatapi.com/v1/images/search";
    } catch (error) {
        console.log(error)
        interaction.followUp(`An error has occurred, please try again later. in /cats`);
    }
  }
}
