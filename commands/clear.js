const { Message, Client } = require('discord.js');

module.exports = {
	name: 'clear',
	aliases: ['c'],
	/**
	 *
	 * @param {Client} client
	 * @param {Message} message
	 * @param {String[]} args
	 */
	run: async (client, message, args) => {
		if (message.author.id !== '163661911924146178') return;
		let amount;
		if (!args.length || isNan(args[0]) || args[0] > 100) amount = 100;
		else if (args[0] < 100) amount = args[0];
		await message.channel.bulkDelete(amount, true);
	},
};
