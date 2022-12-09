import { Discord, Slash, SlashOption } from "discordx";
import {
  CommandInteraction,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
} from "discord.js";
import axios, { AxiosRequestConfig } from "axios";

@Discord()
export class Tss {
  @Slash({ description: "Replies with tts sound" })
  async tss(
    @SlashOption({
      description: "Type the tts you want to hear.",
      name: "tts",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    @SlashOption({
      description: "Type the voice you want to hear.",
      name: "voice",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    tts: string,
    voice: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    try {
      const axiosData = {
        tts: tts,
        voice: voice,
      };
      const url = "https://api-projects.up.railway.app/voices/tss";
      const {
        data: { path },
      } = await axios.post(url, axiosData);
      

      await interaction.followUp({
        files: [
          {
            attachment: String(path),
            name: String(path),
          },
        ],
      });
    } catch (error) {
      console.log(error);
      await interaction.followUp({
        content: "An error has occurred, please try again later.",
      });

    //   setTimeout(() => {
    //     interaction.deleteReply();
    //   }, 5000);
    }
  }
}
