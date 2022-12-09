import { Player, Queue } from "@discordx/music";
import { Pagination, PaginationResolver, PaginationType, } from "@discordx/pagination";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, } from "discord.js";
export class MyQueue extends Queue {
    channel;
    lastControlMessage;
    timeoutTimer;
    lockUpdate = false;
    get playbackMilliseconds() {
        const track = this.currentTrack;
        if (!track?.metadata.isYoutubeTrack() || !track.metadata.info.duration) {
            return 0;
        }
        return this.toMS(track.metadata.info.duration);
    }
    constructor(player, guild, channel) {
        super(player, guild);
        this.channel = channel;
        setInterval(() => this.updateControlMessage(), 1e4);
        // empty constructor
    }
    fromMS(duration) {
        const seconds = Math.floor((duration / 1e3) % 60);
        const minutes = Math.floor((duration / 6e4) % 60);
        const hours = Math.floor(duration / 36e5);
        const secondsPad = `${seconds}`.padStart(2, "0");
        const minutesPad = `${minutes}`.padStart(2, "0");
        const hoursPad = `${hours}`.padStart(2, "0");
        return `${hours ? `${hoursPad}:` : ""}${minutesPad}:${secondsPad}`;
    }
    toMS(duration) {
        const milliseconds = duration
            .split(":")
            .reduceRight((prev, curr, i, arr) => prev + parseInt(curr) * Math.pow(60, arr.length - 1 - i), 0) * 1e3;
        return milliseconds ? milliseconds : 0;
    }
    controlsRow() {
        const nextButton = new ButtonBuilder()
            .setLabel("Siguiente")
            .setEmoji("⏭")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!this.isPlaying)
            .setCustomId("btn-next");
        const pauseButton = new ButtonBuilder()
            .setLabel(this.isPlaying ? "Pausar" : "Reproducir")
            .setEmoji(this.isPlaying ? "⏸️" : "▶")
            .setStyle(this.isPlaying ? ButtonStyle.Primary : ButtonStyle.Success)
            .setCustomId("btn-pause");
        const stopButton = new ButtonBuilder()
            .setLabel("Detener")
            .setStyle(ButtonStyle.Danger)
            .setCustomId("btn-leave");
        const repeatButton = new ButtonBuilder()
            .setLabel("Repetir")
            .setEmoji("🔂")
            .setDisabled(!this.isPlaying)
            .setStyle(this.repeat ? ButtonStyle.Danger : ButtonStyle.Primary)
            .setCustomId("btn-repeat");
        const loopButton = new ButtonBuilder()
            .setLabel("En Bucle")
            .setEmoji("🔁")
            .setDisabled(!this.isPlaying)
            .setStyle(this.loop ? ButtonStyle.Danger : ButtonStyle.Primary)
            .setCustomId("btn-loop");
        const row1 = new ActionRowBuilder().addComponents(stopButton, pauseButton, nextButton, repeatButton, loopButton);
        const queueButton = new ButtonBuilder()
            .setLabel("Ver Cola")
            .setEmoji("👀")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("btn-queue");
        const mixButton = new ButtonBuilder()
            .setLabel("Revolver Cola")
            .setEmoji("🎛️")
            .setDisabled(!this.isPlaying)
            .setStyle(ButtonStyle.Primary)
            .setCustomId("btn-mix");
        const controlsButton = new ButtonBuilder()
            .setLabel("Actualizar")
            .setEmoji("🔄")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("btn-controls");
        const row2 = new ActionRowBuilder().addComponents(queueButton, mixButton, controlsButton);
        return [row1, row2];
    }
    async updateControlMessage(options) {
        if (this.lockUpdate) {
            return;
        }
        this.lockUpdate = true;
        const embed = new EmbedBuilder();
        embed.setTitle("Reproduciendo");
        const currentTrack = this.currentTrack;
        const nextTrack = this.nextTrack;
        if (!currentTrack) {
            if (this.lastControlMessage) {
                await this.lastControlMessage.delete();
                this.lastControlMessage = undefined;
            }
            this.lockUpdate = false;
            return;
        }
        const user = currentTrack.metadata.isYoutubeTrack()
            ? currentTrack.metadata.options?.user
            : currentTrack.metadata?.user;
        embed.addFields({
            name: "En reproduccion" +
                (this.size > 2 ? ` (Total: ${this.size} tracks queued)` : ""),
            value: `[${currentTrack.metadata.title}](${currentTrack.metadata.url ?? "NaN"})${user ? ` por ${user}` : ""}`,
        });
        const progressBarOptions = {
            arrow: "🔘",
            block: "━",
            size: 15,
        };
        if (currentTrack.metadata.isYoutubeTrack()) {
            const { size, arrow, block } = progressBarOptions;
            const timeNow = this.playbackDuration;
            const timeTotal = this.playbackMilliseconds;
            const progress = Math.round((size * timeNow) / timeTotal);
            const emptyProgress = size - progress;
            const progressString = block.repeat(progress) + arrow + block.repeat(emptyProgress);
            const bar = (this.isPlaying ? "▶️" : "⏸️") + " " + progressString;
            const currentTime = this.fromMS(timeNow);
            const endTime = this.fromMS(timeTotal);
            const spacing = bar.length - currentTime.length - endTime.length;
            const time = "`" + currentTime + " ".repeat(spacing * 3 - 2) + endTime + "`";
            embed.addFields({ name: bar, value: time });
        }
        if (currentTrack.metadata.isYoutubeTrack() &&
            currentTrack.metadata.info.bestThumbnail.url) {
            embed.setThumbnail(currentTrack.metadata.info.bestThumbnail.url);
        }
        embed.addFields({
            name: "Siguiente cancion",
            value: nextTrack
                ? `[${nextTrack.title}](${nextTrack.url})`
                : "No hay mas canciones en la cola",
        });
        const pMsg = {
            components: [...this.controlsRow()],
            content: options?.text,
            embeds: [embed],
        };
        if (!this.isReady && this.lastControlMessage) {
            await this.lastControlMessage.delete();
            this.lastControlMessage = undefined;
            this.lockUpdate = false;
            return;
        }
        try {
            if (!this.lastControlMessage || options?.force) {
                if (this.lastControlMessage) {
                    await this.lastControlMessage.delete();
                    this.lastControlMessage = undefined;
                }
                this.lastControlMessage = await this.channel?.send(pMsg);
            }
            else {
                await this.lastControlMessage.edit(pMsg);
            }
        }
        catch (err) {
            // ignore
            console.log(err);
        }
        this.lockUpdate = false;
    }
    async view(interaction) {
        const currentTrack = this.currentTrack;
        if (!this.isReady || !currentTrack) {
            const pMsg = await interaction.reply({
                content: "> No se ha podido procesar la cola por el momento, intenta mas tarde 😔",
                ephemeral: true,
            });
            if (pMsg instanceof Message) {
                setTimeout(() => pMsg.delete(), 3000);
            }
            return;
        }
        if (!this.size) {
            const pMsg = await interaction.reply(`> Reproducciendo **${currentTrack.metadata.title}**`);
            if (pMsg instanceof Message) {
                setTimeout(() => pMsg.delete(), 1e4);
            }
            return;
        }
        const current = `> Reproduciendo **${currentTrack.metadata.title}** de ${this.size + 1}`;
        const pageOptions = new PaginationResolver((index, paginator) => {
            paginator.maxLength = this.size / 10;
            if (index > paginator.maxLength) {
                paginator.currentPage = 0;
            }
            const currentPage = paginator.currentPage;
            const queue = this.tracks
                .slice(currentPage * 10, currentPage * 10 + 10)
                .map((track, index1) => `${currentPage * 10 + index1 + 1}. ${track.title}` +
                `${track.isYoutubeTrack() && track.info.duration
                    ? ` (${track.info.duration})`
                    : ""}`)
                .join("\n\n");
            const obt = { content: `${current}\n\`\`\`markdown\n${queue}\`\`\`` };
            return obt;
        }, Math.round(this.size / 10));
        await new Pagination(interaction, pageOptions, {
            enableExit: true,
            onTimeout: (index, message) => {
                if (message.deletable) {
                    message.delete();
                }
            },
            time: 6e4,
            type: Math.round(this.size / 10) <= 5
                ? PaginationType.Button
                : PaginationType.SelectMenu,
        }).send();
    }
}
export class MyPlayer extends Player {
    constructor() {
        super();
        this.on("onStart", ([queue]) => {
            queue.updateControlMessage({ force: true });
        });
        this.on("onFinishPlayback", ([queue]) => {
            queue.leave();
        });
        this.on("onPause", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onResume", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onError", ([queue, err]) => {
            queue.updateControlMessage({
                force: true,
                text: `Error: ${err.message}`,
            });
        });
        this.on("onFinish", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onLoop", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onRepeat", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onSkip", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onTrackAdd", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onLoopEnabled", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onLoopDisabled", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onRepeatEnabled", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onRepeatDisabled", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onMix", ([queue]) => {
            queue.updateControlMessage();
        });
        this.on("onVolumeUpdate", ([queue]) => {
            queue.updateControlMessage();
        });
    }
    getQueue(guild, channel) {
        return super.queue(guild, () => new MyQueue(this, guild, channel));
    }
}
