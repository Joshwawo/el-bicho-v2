import { Discord, Slash, SlashOption } from "discordx";
import {
  CommandInteraction,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from "discord.js";
import axios from "axios";

@Discord()
export class SoloSinNada {
  @Slash({ description: "Return a sus image", name: "sus" })
 async sus(interaction: CommandInteraction) {
    try {
        await interaction.deferReply();
        const url = "https://api-projects.up.railway.app/images/sus/random?nsfw=false";
        const { data:{susImg} } = await axios.get(url);
        await interaction.followUp(`${susImg}`);

    } catch (error) {
        console.log(error)
        interaction.followUp(`An error has occurred, please try again later. in /sus`);
    }
  }
}