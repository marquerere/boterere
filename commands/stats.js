const { Message, Client, MessageEmbed } = require('discord.js');
const userModel = require('../models/userSchema');

module.exports = {
	name: 'stats',
	aliases: ['s', 'balance'],
	/**
	 *
	 * @param {Client} client
	 * @param {Message} message
	 * @param {String[]} args
	 */
	run: async (client, message, args, userData) => {
		const embed = new MessageEmbed();

		if (!userData) {
			embed
				.setColor('#c41616')
				.setDescription(
					`You must register using \`.register\` before checking your stats!`
				);
		} else {
			embed
				.setColor('#98eb34')
				.setDescription(
					`Balance: **${userData.coins.toLocaleString()}**
					Coins Gifted: **${userData.coinsGifted.toLocaleString()}**

					Bets Won: **${userData.betsWon}**
					Bets Lost: **${userData.betsLost}**

					Top Win: **${userData.topWin.toLocaleString()}**
					Top Balance: **${userData.topBalance.toLocaleString()}**
					Times bankrupt: **${userData.timesBankrupt}**`
				)
				.setAuthor(
					`💸 ${message.author.username}'s stats 💸`,
					message.author.avatarURL()
				);
		}

		message.reply({ embeds: [embed] });
	},
};
