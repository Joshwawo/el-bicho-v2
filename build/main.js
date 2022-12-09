import { dirname, importx } from "@discordx/importer";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import 'dotenv/config';
import { generateDependencyReport } from '@discordjs/voice';
export const bot = new Client({
    // To use only guild command
    // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
    // Discord intents
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates,
    ],
    // Debug logs are disabled in silent mode
    silent: false,
    // Configuration for @SimpleCommand
    simpleCommand: {
        prefix: "!",
    },
});
bot.once("ready", async () => {
    // Make sure all guilds are cached
    // await bot.guilds.fetch();
    console.log(generateDependencyReport());
    // Synchronize applications commands with Discord
    await bot.initApplicationCommands();
    // To clear all guild commands, uncomment this line,
    // This is useful when moving from guild commands to global commands
    // It must only be executed once
    //
    //  await bot.clearApplicationCommands(
    //    ...bot.guilds.cache.map((g) => g.id)
    //  );
    console.log("Bot started");
});
bot.on("interactionCreate", (interaction) => {
    bot.executeInteraction(interaction);
});
bot.on("messageCreate", (message) => {
    bot.executeCommand(message);
});
async function run() {
    // The following syntax should be used in the commonjs environment
    //
    // await importx(__dirname + "/{events,commands}/**/*.{ts,js}");
    // The following syntax should be used in the ECMAScript environment
    await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
    // Let's start the bot
    if (!process.env.BOT_TOKEN) {
        throw Error("Could not find BOT_TOKEN in your environment");
    }
    // Log in with your bot token
    await bot.login(process.env.BOT_TOKEN);
}
run();