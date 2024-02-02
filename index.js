// Main file for the Discord bot

// Require the necessary discord.js classes
const fs = require('node:fs');    // Node's native file system. Used to read the commands directory
const path = require('node:path') // Node's native path utility module
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const internal = require('node:stream');

// Access token from environment variable
// Alternative to using a config.json file
const token = process.env.ARCHERBOT_TOKEN;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


// Load command files
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}


// Log in to Discord with token
client.login(token);