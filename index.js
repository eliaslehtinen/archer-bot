// Main file for the Discord bot

// Import dependencies
const Discord = require("discord.js");
const { prefix } = require("./config.json");
const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg");
const token = process.env.ARCHERBOT_TOKEN;
const { generateDependencyReport, createAudioPlayer } = require("@discordjs/voice");

console.log(generateDependencyReport());

// Create client
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.MessageContent,
    ],
});

// Add listeners
client.once("ready", () => {
    console.log("Ready!");
});
client.once("reconnecting", () => {
    console.log("Reconnecting!");
});
client.once("disconnect", () => {
    console.log("Disconnect!");
});

// Listen for new messages
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    } else {
        // TODO: Update if more commands added
        message.channel.send("You need to enter a valid command!\n"+
        "Available commands are !play, !skip and !stop.")
    }
});

// Create map that stores all songs in queue
const queue = new Map();

/*
Checks if user in voice channel and bot has right permissions
and tries to add a new song to the queue.
*/
const player = createAudioPlayer();

async function execute(message, serverQueue) {
    // Splits message into separate strings
    const args = message.content.split(" ");

    // Check permissions
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            "You need to be in a voice channel to play music!"    
        );
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(Discord.PermissionsBitField.Flags.Connect) || !permissions.has(Discord.PermissionsBitField.Flags.Speak)) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    // Get song info from message
    // args[1] should be a YouTube link
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    // Check if queue exists and if not, create new queue
    if (!serverQueue || serverQueue.songs.length <= 0) {
        // create new queue
        const queueContract = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };
        // Setting the queue using our contract
        queue.set(message.guild.id, queueContract);
        // Push song to songs array
        queueContract.songs.push(song);

        // Try to join voicechat
        try {

            const { joinVoiceChannel } = require("@discordjs/voice")
            var connection = await joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
            queueContract.connection = connection;
            queueContract.connection.subscribe(player);
            // Start playing a song
            play(message.guild, player, queueContract.songs[0]);
        } catch (err) {
            // Print error message if bot fails to join voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        // add song to existing queue
        serverQueue.songs.push(song);
        console.log("Song added to the queue!")
        console.log(serverQueue.songs);
        return message.channel.send(`**${song.title}** has been added to the queue!`);
    }
}


// Skips current song and starts playing the next in queue
function skip(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to skip the song!");
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could skip!");
    }
    player.stop();
    return;
}


// Clears queue and stops playing music
function stop(message, serverQueue) {
    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to stop the music!");
    }
    if (!serverQueue) {
        return message.channel.send("There is no song that I could stop!");
    }
    serverQueue.songs = [];
    player.stop();
    return;
}


function play(guild, player, song) {
    const { AudioPlayerStatus, createAudioResource, VoiceConnectionState, VoiceConnectionDestroyedState } = require("@discordjs/voice");
    const serverQueue = queue.get(guild.id);

    // If no song in queue, leave voicechannel
    if (!song) {
        player.stop()

        serverQueue.connection.disconnect();
        serverQueue.songs = [];
        console.log("Connection disconnected!");
        /*
        if (serverQueue.connection.state != VoiceConnectionDestroyedState) {
            serverQueue.connection.destroy();
            console.log("Connection destroyed!");
        }
        */
        console.log("No songs in queue. Stopped playing!");
        return;
    }

    try {
        let resource = createAudioResource(ytdl(song.url, { filter: "audioonly" } ));
        player.play(resource)
        player.on(AudioPlayerStatus.Idle, () => {
            console.log("Audio player idle...")
            // play-function calls itself recursively to play the next song
            console.log("Moving to next song in queue.")
            serverQueue.songs.shift();
            play(guild, player, serverQueue.songs[0]);
        })
    } catch (err) {
        console.error(err);
    }

    let title = song.title;
    serverQueue.textChannel.send(`Start playing: **${title}**`);
    console.log(`Now playing: ${title}.`)
}

// Log in
client.login(token);
