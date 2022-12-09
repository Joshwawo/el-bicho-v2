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
            queue.channel.send("> To save resources, I have paused the queue since everyone has left my voice channel.");
            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
            }
            queue.timeoutTimer = setTimeout(() => {
                queue.channel?.send("> My voice channel has been open for 5 minutes and no one has joined, so the queue has been deleted.");
                queue.leave();
            }, 5 * 60 * 1000);
        }
        else if (queue.isPause && totalMembers.size) {
            if (queue.timeoutTimer) {
                clearTimeout(queue.timeoutTimer);
                queue.timeoutTimer = undefined;
            }
            queue.resume();
            queue.channel.send("> There has been a new participant in my voice channel, and the queue will be resumed. Enjoy the music 🎶");
        }
    }
    validateControlInteraction(interaction) {
        if (!interaction.guild ||
            !interaction.channel ||
            !(interaction.member instanceof GuildMember)) {
            interaction.reply("> Your request could not be processed, please try again later");
            return;
        }
        const queue = this.player.getQueue(interaction.guild, interaction.channel);
        if (interaction.member.voice.channelId !== queue.voiceChannelId) {
            interaction.reply("> To use the controls, you need to join the bot voice channel");
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
            interaction.reply("> Your request could not be processed, please try again later");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        if (!(interaction.member instanceof GuildMember) ||
            !interaction.member.voice.channel) {
            interaction.reply("> You are not in the voice channel");
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
    async play(songName, interaction) {
        const queue = await this.processJoin(interaction);
        if (!queue) {
            return;
        }
        const song = await queue.play(songName, { user: interaction.user });
        if (!song) {
            interaction.followUp("The song could not be found");
        }
        else {
            const embed = new EmbedBuilder();
            embed.setTitle("Enqueued");
            embed.setDescription(`Enqueued song **${song.title}****`);
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
            interaction.followUp("The playlist could not be found");
        }
        else {
            const embed = new EmbedBuilder();
            embed.setTitle("Enqueued");
            embed.setDescription(`Enqueued  **${songs.length}** songs from playlist`);
            interaction.followUp({ embeds: [embed] });
        }
    }
    validateInteraction(interaction) {
        if (!interaction.guild ||
            !(interaction.member instanceof GuildMember) ||
            !interaction.channel) {
            interaction.reply("> Your request could not be processed, please try again later");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        if (!interaction.member.voice.channel) {
            interaction.reply("> To use the music commands, you need to join voice channel");
            setTimeout(() => interaction.deleteReply(), 15e3);
            return;
        }
        const queue = this.player.getQueue(interaction.guild, interaction.channel);
        if (!queue.isReady ||
            interaction.member.voice.channel.id !== queue.voiceChannelId) {
            interaction.reply("> To use the music commands, you need to join the bot voice channel");
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
        interaction.reply("> skipped current song");
    }
    mix(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        queue.mix();
        interaction.reply("> mixed current queue");
    }
    pause(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        if (queue.isPause) {
            interaction.reply("> already paused");
            return;
        }
        queue.pause();
        interaction.reply("> paused music");
    }
    resume(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        if (queue.isPlaying) {
            interaction.reply("> already playing");
            return;
        }
        queue.resume();
        interaction.reply("> resumed music");
    }
    seek(time, interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        if (!queue.isPlaying || !queue.currentTrack) {
            interaction.reply("> currently not playing any song");
            return;
        }
        const state = queue.seek(time * 1000);
        if (!state) {
            interaction.reply("> could not seek");
            return;
        }
        interaction.reply("> current music seeked");
    }
    leave(interaction) {
        const validate = this.validateInteraction(interaction);
        if (!validate) {
            return;
        }
        const { queue } = validate;
        queue.leave();
        interaction.reply("> stopped music");
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
    Slash({ description: "Play a song" }),
    __param(0, SlashOption({
        description: "song url or title",
        name: "song",
        required: true,
        type: ApplicationCommandOptionType.String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "play", null);
__decorate([
    Slash({ description: "Play a playlist" }),
    __param(0, SlashOption({
        description: "playlist name",
        name: "playlist",
        required: true,
        type: ApplicationCommandOptionType.String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], music.prototype, "playlist", null);
__decorate([
    Slash({ description: "skip track" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "skip", null);
__decorate([
    Slash({ description: "mix tracks" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "mix", null);
__decorate([
    Slash({ description: "pause music" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "pause", null);
__decorate([
    Slash({ description: "resume music" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "resume", null);
__decorate([
    Slash({ description: "seek music" }),
    __param(0, SlashOption({
        description: "seek time in seconds",
        name: "time",
        required: true,
        type: ApplicationCommandOptionType.Number,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "seek", null);
__decorate([
    Slash({ description: "stop music" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], music.prototype, "leave", null);
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
