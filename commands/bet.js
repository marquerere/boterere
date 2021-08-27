const {
	Message,
	Client,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
} = require('discord.js');
const betModel = require('../models/betSchema');

module.exports = {
	name: 'bet',
	aliases: ['b'],
	/**
	 *
	 * @param {Client} client
	 * @param {Message} message
	 * @param {String[]} args
	 */
	run: async (client, message, args, userData) => {
		const embed = new MessageEmbed();

		if (!args.length || args.length < 3 || args.length > 6) {
			embed.setColor('#c41616').setDescription(
				`You need atleast 3 parameters for this command:
                    \`${client.config.prefix}bet bet_title option_1 option_2\`
					A maximum of 5 options is allowed.`
			);

			return message.channel.send({
				embeds: [embed],
			});
		}

		const betTitle = args[0];
		const options = args.slice(1, args.length);

		const newBet = await betModel.create({
			ownerId: message.author.id,
			title: betTitle,
			options: options.map((option) => {
				return { title: option, pot: 0, users: [] };
			}),
		});
		newBet.save();
		console.log(`Created a new Bet`);

		const optionsRow = new MessageActionRow();
		options.forEach((option, i) => {
			optionsRow.addComponents(
				new MessageButton()
					.setCustomId(`option_${newBet.id}_${i}`)
					.setLabel(option)
					.setStyle('SECONDARY')
			);
		});

		const actionsRow = new MessageActionRow().addComponents(
			new MessageButton()
				.setCustomId(`close_${newBet.id}`)
				.setLabel('Close Bet')
				.setStyle('PRIMARY'),
			new MessageButton()
				.setCustomId(`cancel_${newBet.id}`)
				.setLabel('Cancel Bet')
				.setStyle('DANGER')
		);

		embed
			.setColor('#34eba1')
			.setDescription(``)
			.setAuthor(
				`${betTitle}`,
				'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
			);

		const infoMessage = await message.channel.send({
			embeds: [embed],
			components: [optionsRow, actionsRow],
		});

		await betModel.findOneAndUpdate(
			{ _id: newBet.id },
			{ $set: { messageId: infoMessage.id } }
		);

		// If the bet isn't closed manually by the owner it should close automatically after the time interval specified in the config.
		setTimeout(async () => {
			let bet = await betModel.findOne({ _id: newBet.id });

			if (bet.open) {
				let description = '';
				bet.options.forEach((option) => {
					option.users.forEach(async (user) => {
						const member = await message.guild.members.fetch(
							user.id
						);
						description =
							description +
							`\n${member} wagered **${user.bet}** on ${option.title}`;
					});
				});

				embed
					.setColor('#c41616')
					.setDescription(
						`${description}
						
						**Bets Closed!**
					Waiting for ${message.author} to pick a winner.`
					)
					.setAuthor(
						`${betTitle}`,
						'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
					);

				infoMessage.edit({
					embeds: [embed],
					components: [
						new MessageActionRow().addComponents(
							new MessageButton()
								.setCustomId(`close_${bet.id}`)
								.setLabel('Pick a Winner')
								.setStyle('SUCCESS'),
							new MessageButton()
								.setCustomId(`cancel_${bet.id}`)
								.setLabel('Cancel Bet')
								.setStyle('DANGER')
						),
					],
				});

				await betModel.findOneAndUpdate(
					{ _id: bet.id },
					{ $set: { open: false } }
				);
			} else if (!bet.open && bet.users) return;
		}, client.config.betDuration);
	},
};
