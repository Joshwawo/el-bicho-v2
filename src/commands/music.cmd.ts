import type { CommandInteraction, Guild } from "discord.js";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import type { ArgsOf } from "discordx";
import {
  ButtonComponent,
  Discord,
  On,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";

import type { MyQueue } from "./music.js";
import { MyPlayer } from "./music.js";

@Discord()
// Create music group
@SlashGroup({ description: "music", name: "music" })
// Assign all slashes to music group
@SlashGroup("music")
export class music {
  player;

  constructor() {
    this.player = new MyPlayer();
  }

  @On()
  voiceStateUpdate([oldState, newState]: ArgsOf<"voiceStateUpdate">): void {
    const queue = this.player.getQueue(oldState.guild);

    if (
      !queue.isReady ||
      !queue.voiceChannelId ||
      (oldState.channelId != queue.voiceChannelId &&
        newState.channelId != queue.voiceChannelId) ||
      !queue.channel
    ) {
      return;
    }

    const channel =
      oldState.channelId === queue.voiceChannelId
        ? oldState.channel
        : newState.channel;

    if (!channel) {
      return;
    }

    const totalMembers = channel.members.filter((m) => !m.user.bot);

    if (queue.isPlaying && !totalMembers.size) {
      queue.pause();
      queue.channel.send(
        "> Para ahorrar recursos, la cola se pausará hasta que alguien se una a al canal de voz canal de voz."
      );

      if (queue.timeoutTimer) {
        clearTimeout(queue.timeoutTimer);
      }

      queue.timeoutTimer = setTimeout(() => {
        queue.channel?.send(
          "> E lcanall de voz ha estado inactivo durante 5 minutos, y la cola se ha detenido. "
        );
        queue.leave();
      }, 5 * 60 * 1000);
    } else if (queue.isPause && totalMembers.size) {
      if (queue.timeoutTimer) {
        clearTimeout(queue.timeoutTimer);
        queue.timeoutTimer = undefined;
      }
      queue.resume();
      queue.channel.send(
        "> Hay un nuevo participante en mi canal de voz y se reanudará la cola. Disfruta de la música!"
      );
    }
  }

  validateControlInteraction(
    interaction: CommandInteraction
  ): MyQueue | undefined {
    if (
      !interaction.guild ||
      !interaction.channel ||
      !(interaction.member instanceof GuildMember)
    ) {
      interaction.reply(
        "> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔."
      );
      return;
    }

    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (interaction.member.voice.channelId !== queue.voiceChannelId) {
      interaction.reply(
        "> Para poder usar este comando, debe estar en el mismo canal de voz que el bot."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    return queue;
  }

  @ButtonComponent({ id: "btn-next" })
  async nextControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.skip();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent({ id: "btn-pause" })
  async pauseControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.isPause ? queue.resume() : queue.pause();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent({ id: "btn-leave" })
  async leaveControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.leave();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent({ id: "btn-repeat" })
  async repeatControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.setRepeat(!queue.repeat);
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent({ id: "btn-queue" })
  queueControl(interaction: CommandInteraction): void {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.view(interaction);
  }

  @ButtonComponent({ id: "btn-mix" })
  async mixControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.mix();
    await interaction.deferReply();
    interaction.deleteReply();
  }

  @ButtonComponent({ id: "btn-controls" })
  async controlsControl(interaction: CommandInteraction): Promise<void> {
    const queue = this.validateControlInteraction(interaction);
    if (!queue) {
      return;
    }
    queue.updateControlMessage({ force: true });
    await interaction.deferReply();
    interaction.deleteReply();
  }

  async processJoin(
    interaction: CommandInteraction
  ): Promise<MyQueue | undefined> {
    if (
      !interaction.guild ||
      !interaction.channel ||
      !(interaction.member instanceof GuildMember)
    ) {
      interaction.reply(
        "> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    if (
      !(interaction.member instanceof GuildMember) ||
      !interaction.member.voice.channel
    ) {
      interaction.reply(
        "> Debes estar en un canal de voz para usar este comando."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    await interaction.deferReply();
    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (!queue.isReady) {
      queue.channel = interaction.channel;
      await queue.join(interaction.member.voice.channel);
    }

    return queue;
  }
//*Aqui empiezan los comandas slash
  @Slash({ description: "Reproduce una canción" })
  async play(
    @SlashOption({
      description: "url o nombre de la canción",
      name: "song",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    songName: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const queue = await this.processJoin(interaction);
    if (!queue) {
      return;
    }
    const song = await queue.play(songName, { user: interaction.user });
    if (!song) {
      const embed = new EmbedBuilder();
      embed.setTitle(`${interaction.user.username} No se encontró la canción o la URL no es válida 😔`);
      embed.setColor("#F20B35");
      interaction.followUp({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder();
      embed.setTitle("Agregada a la cola");
      embed.setColor("#0BF296");
      embed.setDescription(`Cancion **${song.title}****`);
      interaction.followUp({ embeds: [embed] });
    }
  }

  @Slash({ description: "Reproduce una playlist" })
  async playlist(
    @SlashOption({
      description: "nombre de la playlist",
      name: "playlist",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    playlistName: string,
    interaction: CommandInteraction
  ): Promise<void> {
    const queue = await this.processJoin(interaction);
    if (!queue) {
      return;
    }
    const songs = await queue.playlist(playlistName, {
      user: interaction.user,
    });
    if (!songs) {
      const embed = new EmbedBuilder();
      embed.setTitle(`${interaction.user.username} No se encontró la canción o la URL no es válida 😔`);
      embed.setColor("#F20B35");
      interaction.followUp({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder();
      embed.setTitle("Agregada a la cola");
      embed.setColor("#0BF296");

      embed.setDescription(`Se agregaron  **${songs.length}** canciones de la playlist **${playlistName}**`);
      interaction.followUp({ embeds: [embed] });
    }
  }

  validateInteraction(
    interaction: CommandInteraction
  ): undefined | { guild: Guild; member: GuildMember; queue: MyQueue } {
    if (
      !interaction.guild ||
      !(interaction.member instanceof GuildMember) ||
      !interaction.channel
    ) {
      interaction.reply(
        "> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    if (!interaction.member.voice.channel) {
      interaction.reply(
        "> Debes estar en un canal de voz para usar este comando."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    const queue = this.player.getQueue(interaction.guild, interaction.channel);

    if (
      !queue.isReady ||
      interaction.member.voice.channel.id !== queue.voiceChannelId
    ) {
      interaction.reply(
        "> Debes estar en el mismo canal de voz que el bot para usar este comando."
      );

      setTimeout(() => interaction.deleteReply(), 15e3);
      return;
    }

    return { guild: interaction.guild, member: interaction.member, queue };
  }

  @Slash({ description: "Siguiente cancion" })
  skip(interaction: CommandInteraction): void {
    const validate = this.validateInteraction(interaction);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    queue.skip();
    interaction.reply("> cancion actual saltada");
  }

  @Slash({ description: "mixear la cola, revuelte la cola actual" })
  mix(interaction: CommandInteraction): void {
    const validate = this.validateInteraction(interaction);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    queue.mix();
    interaction.reply("> cola mezclada");
  }

  @Slash({ description: "pausar musica" })
  pause(interaction: CommandInteraction): void {
    const validate = this.validateInteraction(interaction);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    if (queue.isPause) {
      interaction.reply("> ya esta pausado");
      return;
    }

    queue.pause();
    interaction.reply("> musica pausada");
  }

  @Slash({ description: "reanudar musica" })
  resume(interaction: CommandInteraction): void {
    const validate = this.validateInteraction(interaction);
    if (!validate) {
      return;
    }

    const { queue } = validate;

    if (queue.isPlaying) {
      interaction.reply("> ya esta reproduciendo");
      return;
    }

    queue.resume();
    interaction.reply("> musica reanudada");
  }

  // @Slash({ description: "seek music" })
  // seek(
  //   @SlashOption({
  //     description: "seek time in seconds",
  //     name: "time",
  //     required: true,
  //     type: ApplicationCommandOptionType.Number,
    
  //   })
  //   time: number,
  //   interaction: CommandInteraction
  // ): void {
  //   const validate = this.validateInteraction(interaction);
  //   if (!validate) {
  //     return;
  //   }

  //   const { queue } = validate;

  //   if (!queue.isPlaying || !queue.currentTrack) {
  //     interaction.reply("> currently not playing any song");
  //     return;
  //   }

  //   const state = queue.seek(time * 1000);
  //   console.log(state)
  //   if (!state) {
  //     interaction.reply("> could not seek");
  //     return;
  //   }
  //   interaction.reply("> current music seeked");
  // }

  @Slash({ description: "detener musica" })
  detener(interaction: CommandInteraction): void {
    const validate = this.validateInteraction(interaction);
    if (!validate) {
      return;
    }

    const { queue } = validate;
    queue.leave();
    interaction.reply("> musica detenida");
  }
}
