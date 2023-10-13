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