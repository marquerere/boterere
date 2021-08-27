const { Message, Client, MessageEmbed } = require('discord.js');
const userModel = require('../models/userSchema');

module.exports = {
	name: 'register',
	aliases: ['r', 'reg'],
	/**
	 *
	 * @param {Client} client
	 * @param {Message} message
	 * @param {String[]} args
	 */
	run: async (client, message, args, userData) => {
		const embed = new MessageEmbed();

		if (!userData) {
			const user = await userModel.create({
				userId: message.author.id,
				serverId: message.guild.id,
			});
			user.save();

			embed
				.setColor('#98eb34')
				.setDescription(`Account created for ${message.member}!`);
		} else {
			embed
				.setColor('#c41616')
				.setDescription(`You already have an account!`);
		}

		message.reply({ embeds: [embed] });
	},
};
