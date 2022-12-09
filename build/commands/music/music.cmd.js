var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, } from "discord.js";
import { ButtonComponent, Discord, On, Slash, SlashGroup, SlashOption, } from "discordx";
import { MyPlayer } from "./music.js";
let music = class music {
    player;
    constructor() {
        this.player = new MyPlayer();
    }
    voiceStateUpdate([oldState, newState]) {
        const queue = this.player.getQueue(oldState.guild);
        if (!queue.isReady ||
            !queue.voiceChannelId ||
            (oldState.channelId != queue.voiceChannelId &&
                newState.channelId != queue.voiceChannelId) ||
            !queue.channel) {
            return;
        }
        const channel = oldState.channelId === queue.voiceChannelId
            ? oldState.channel
            : newState.channel;
        if (!channel) {
            return;
        }
        const totalMembers = channel.members.filter((m) => !m.user.bot);
        if (queue.isPlaying && !totalMembers.size) {
            queue.pause();
            queue.channel.send("> Para ahorrar recursos, la cola se pausará hasta que alguien se una a al canal de voz canal de voz.");
            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
            }
            queue.timeoutTimer = setTimeout(() => {
                queue.channel?.send("> E lcanall de voz ha estado inactivo durante 5 minutos, y la cola se ha detenido. ");
                queue.leave();
            }, 5 * 60 * 1000);
        }
        else if (queue.isPause && totalMembers.size) {
            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
                queue.timeoutTimer = undefined;
            }
            queue.resume();
            queue.channel.send("> Hay un nuevo participante en mi canal de voz y se reanudará la cola. Disfruta de la música!");
        }
    }
    validateControlInteraction(interaction) {
        if (!interaction.guild ||
            !interaction.channel ||
            !(interaction.member instanceof GuildMember)) {
            interaction.reply("> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔.");
            return;
        }
        const queue = this.player.getQueue(interaction.guild, interaction.channel);
        if (interaction.member.voice.channelId !== queue.voiceChannelId) {
            interaction.reply("> Para poder usar este comando, debe estar en el mismo canal de voz que el bot.");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        return queue;
    }
    async nextControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.skip();
        await interaction.deferReply();
        interaction.deleteReply();
    }
    async pauseControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.isPause ? queue.resume() : queue.pause();
        await interaction.deferReply();
        interaction.deleteReply();
    }
    async leaveControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.leave();
        await interaction.deferReply();
        interaction.deleteReply();
    }
    async repeatControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.setRepeat(!queue.repeat);
        await interaction.deferReply();
        interaction.deleteReply();
    }
    queueControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.view(interaction);
    }
    async mixControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.mix();
        await interaction.deferReply();
        interaction.deleteReply();
    }
    async controlsControl(interaction) {
        const queue = this.validateControlInteraction(interaction);
        if (!queue) {
            return;
        }
        queue.updateControlMessage({ force: true });
        await interaction.deferReply();
        interaction.deleteReply();
    }
    async processJoin(interaction) {
        if (!interaction.guild ||
            !interaction.channel ||
            !(interaction.member instanceof GuildMember)) {
            interaction.reply("> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔.");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        if (!(interaction.member instanceof GuildMember) ||
            !interaction.member.voice.channel) {
            interaction.reply("> Debes estar en un canal de voz para usar este comando.");
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
    async play(songName, interaction) {
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
        }
        else {
            const embed = new EmbedBuilder();
            embed.setTitle("Agregada a la cola");
            embed.setColor("#0BF296");
            embed.setDescription(`Cancion **${song.title}****`);
            interaction.followUp({ embeds: [embed] });
        }
    }
    async playlist(playlistName, interaction) {
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
        }
        else {
            const embed = new EmbedBuilder();
            embed.setTitle("Agregada a la cola");
            embed.setColor("#0BF296");
            embed.setDescription(`Se agregaron  **${songs.length}** canciones de la playlist **${playlistName}**`);
            interaction.followUp({ embeds: [embed] });
        }
    }
    validateInteraction(interaction) {
        if (!interaction.guild ||
            !(interaction.member instanceof GuildMember) ||
            !interaction.channel) {
            interaction.reply("> Su solicitud no se puede procesar en este momento. Inténtalo de nuevo más tarde 😔.");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        if (!interaction.member.voice.channel) {
            interaction.reply("> Debes estar en un canal de voz para usar este comando.");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        const queue = this.player.getQueue(interaction.guild, interaction.channel);
        if (!queue.isReady ||
            interaction.member.voice.channel.id !== queue.voiceChannelId) {
            interaction.reply("> Debes estar en el mismo canal de voz que el bot para usar este comando.");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        return { guild: interaction.guild, member: interaction.member, queue };
    }
    skip(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        queue.skip();
        interaction.reply("> cancion actual saltada");
    }
    mix(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        queue.mix();
        interaction.reply("> cola mezclada");
    }
    pause(interaction) {
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
    resume(interaction) {
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
    detener(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        queue.leave();
        interaction.reply("> musica detenida");
    }
};
__decorate([
    On(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], music.prototype, "voiceStateUpdate", null);
__decorate([
    ButtonComponent({ id: "btn-next" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "nextControl", null);
__decorate([
    ButtonComponent({ id: "btn-pause" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "pauseControl", null);
__decorate([
    ButtonComponent({ id: "btn-leave" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "leaveControl", null);
__decorate([
    ButtonComponent({ id: "btn-repeat" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "repeatControl", null);
__decorate([
    ButtonComponent({ id: "btn-queue" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "queueControl", null);
__decorate([
    ButtonComponent({ id: "btn-mix" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "mixControl", null);
__decorate([
    ButtonComponent({ id: "btn-controls" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "controlsControl", null);
__decorate([
    Slash({ description: "Reproduce una canción" }),
    __param(0, SlashOption({
        description: "url o nombre de la canción",
        name: "song",
        required: true,
        type: ApplicationCommandOptionType.String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "play", null);
__decorate([
    Slash({ description: "Reproduce una playlist" }),
    __param(0, SlashOption({
        description: "nombre de la playlist",
        name: "playlist",
        required: true,
        type: ApplicationCommandOptionType.String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "playlist", null);
__decorate([
    Slash({ description: "Siguiente cancion" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "skip", null);
__decorate([
    Slash({ description: "mixear la cola, revuelte la cola actual" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "mix", null);
__decorate([
    Slash({ description: "pausar musica" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "pause", null);
__decorate([
    Slash({ description: "reanudar musica" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "resume", null);
__decorate([
    Slash({ description: "detener musica" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "detener", null);
music = __decorate([
    Discord()
    // Create music group
    ,
    SlashGroup({ description: "music", name: "music" })
    // Assign all slashes to music group
    ,
    SlashGroup("music"),
    __metadata("design:paramtypes", [])
], music);
export { music };
