const { Client, Collection, Intents } = require('discord.js');

const config = require('./config.js');

const client = new Client({
	intents: 32767,
});
module.exports = client;

// Global Variables
client.commands = new Collection();
client.slashCommands = new Collection();
client.config = config;

// Initializing the project
require('./handler')(client);

client.login(client.config.token);
