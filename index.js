// Main file for the Discord bot

// Import dependencies
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const ytdl = require('ytdl-core');
const token = process.env.ARCHERBOT_TOKEN;

// Create client and log in
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
    ],
});
client.login(token);

// Add listeners
client.once('ready', () => {
    console.log('Ready!');
})
client.once('reconnecting', () => {
    console.log('Reconnecting!');
})
client.once('disconnect', () => {
    console.log('Disconnect!');
})

// Listen for new messages
client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith('${prefix}play')) {
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith('${prefix}skip')) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith('${prefix}stop')) {
        stop(message, serverQueue);
        return;
    } else {
        // TODO: Update if more commands added
        message.channel.send('You need to enter a valid command!\n'+
        'Available commands are !play, !skip and !stop.')
    }
})

// Create map that stores all songs in queue
const queue = new Map();

/*
Checks if user in voice channel and bot has right permissions
and tries to add a new song to the queue.
*/
async function execute(message, serverQueue) {
    // Splits message into separate strings
    const args = message.content.split(' ');

    // Check permissions
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.channel.send(
            'You need to be in a voice channel to play music!'    
        );
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has("SPEAK")) {
        return message.channel.send(
            'I need the permissions to join and speak in your voice channel!'
        );
    }

    // Get song info from message
    // args[1] should be a YouTube link
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.videostats_playback_base_url,
    };

    // Check if queue exists and if not, create new queue
    if (!serverQueue) {
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

        // Try to join voicechat and save connection
        try {
            var connection = await voiceChannel.join();
            queueContract.connection = connection;
            // Start playing a song
            play(message.guild, queueContract.songs[0]);
        } catch (err) {
            // Print error message if bot fails to join voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        // add song to existing queue
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send('${song.title} has been added to the queue!');
    }
}