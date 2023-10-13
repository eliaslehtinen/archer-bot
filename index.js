// Main file for the Discord bot

// Import dependencies
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const ytdl = require('ytdl-core');
const token = process.env.ARCHERBOT_TOKEN;

// Create client and log in
const client = new Discord.Client();
client.login(token);

// Add listeners
Client.once('ready', () => {
    console.log('Ready!');
})
Client.once('reconnecting', () => {
    console.log('Reconnecting!');
})
Client.once('disconnect', () => {
    console.log('Disconnect!');
})