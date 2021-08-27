const {
	MessageEmbed,
	MessageActionRow,
	MessageButton,
	MessageCollector,
} = require('discord.js');
const betModel = require('../models/betSchema');
const userModel = require('../models/userSchema');
const client = require('../index');

client.on('interactionCreate', async (interaction) => {
	// Slash Command Handling
	if (interaction.isCommand()) {
		await interaction.deferReply({ ephemeral: false }).catch(() => {});

		const cmd = client.slashCommands.get(interaction.commandName);
		if (!cmd)
			return interaction.followUp({ content: 'An error has occured ' });

		const args = [];

		for (let option of interaction.options.data) {
			if (option.type === 'SUB_COMMAND') {
				if (option.name) args.push(option.name);
				option.options?.forEach((x) => {
					if (x.value) args.push(x.value);
				});
			} else if (option.value) args.push(option.value);
		}
		interaction.member = interaction.guild.members.cache.get(
			interaction.user.id
		);

		cmd.run(client, interaction, args);
	}

	// Context Menu Handling
	if (interaction.isContextMenu()) {
		await interaction.deferReply({ ephemeral: false });
		const command = client.slashCommands.get(interaction.commandName);
		if (command) command.run(client, interaction);
	}

	// Buttons Handling
	if (interaction.isButton()) {
		if (interaction.customId.includes('_')) {
			const [type, ...args] = interaction.customId.split('_');

			const bet = await betModel.findOne({ _id: args[0] });
			if (!bet) {
				return interaction.reply({
					embeds: [
						new MessageEmbed()
							.setColor('#c41616')
							.setDescription(
								`An error ocurred, please try again.`
							),
					],
					ephemeral: true,
				});
			}

			switch (type) {
				case 'close':
					closeBet(interaction, bet);
					break;
				case 'cancel':
					cancelBet(interaction, bet);
					break;
				case 'option':
					chooseOption(interaction, bet, args[1]);
					break;
			}
		}
	}
});

async function chooseOption(interaction, bet, option) {
	const userProfile = await userModel.findOne({
		userId: interaction.member.id,
	});

	if (!userProfile) {
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('#c41616')
					.setDescription(
						`Sorry ${interaction.member}, you must \`.register\` before placing bets.`
					),
			],
			ephemeral: true,
		});
	}

	if (!bet.open) {
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('#c41616')
					.setDescription(`This bet is already closed.`),
			],
			ephemeral: true,
		});
	}

	if (bet.users.some((user) => user.id === interaction.member.id)) {
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('#c41616')
					.setDescription(`You have already placed a bet.`),
			],
			ephemeral: true,
		});
	}

	const filter = async (message) => {
		if (
			message.content &&
			message.content.split(' ').length === 1 &&
			message.member.id === interaction.member.id &&
			!message.author.bot
		) {
			return true;
		}

		if (message.member.id === interaction.member.id)
			message.reply({
				embeds: [
					new MessageEmbed()
						.setColor('#34eba1')
						.setDescription(
							`Send a message with only the amount you wish to bet.`
						),
				],
				ephemeral: true,
			});

		return false;
	};

	const selectedOption = bet.options[option];

	interaction.reply({
		embeds: [
			new MessageEmbed()
				.setColor('#34eba1')
				.setDescription(
					`Type the amount you wish to bet on **${selectedOption.title}**`
				),
		],
		ephemeral: true,
	});

	const collector = new MessageCollector(interaction.channel, {
		filter: filter,
		time: client.config.betDuration,
	});

	collector.on('collect', async (message) => {
		let amount;

		try {
			amount = parseInt(message.content);
		} catch (err) {
			message.reply({
				embeds: [
					new MessageEmbed()
						.setColor('#34eba1')
						.setDescription(
							`Insert a valid number as the value you wish to bet.`
						),
				],
				ephemeral: true,
			});
		}
		if (!amount) {
			return;
		}

		if (amount % 1 != 0 || amount <= 0) {
			return message.reply({
				embeds: [
					new MessageEmbed()
						.setColor('#34eba1')
						.setDescription(`Amount must be a valid number.`),
				],
				ephemeral: true,
			});
		}

		if (amount > userProfile.coins) {
			return message.reply({
				embeds: [
					new MessageEmbed().setColor('#34eba1').setDescription(
						`You do not have enough coins.
								Current balance: **${userProfile.coins.toLocaleString()}**`
					),
				],
				ephemeral: true,
			});
		}

		await userModel.findOneAndUpdate(
			{
				userId: message.member.id,
			},
			{
				$inc: { coins: -amount },
			}
		);

		const updatedBet = await betModel.findOneAndUpdate(
			{ _id: bet.id, 'options.title': selectedOption.title },
			{
				$push: {
					users: {
						id: message.member.id,
						name: message.member.user.username,
					},
					'options.$.users': {
						id: message.member.id,
						bet: amount,
						name: message.member.user.username,
					},
				},
				$inc: { 'options.$.pot': amount, pot: amount },
			}
		);

		interaction.channel.messages
			.fetch(updatedBet.messageId)
			.then((message) => {
				message.edit({
					embeds: [
						new MessageEmbed()
							.setColor('#c41616')
							.setDescription(
								`${message.embeds[0].description ?? ''}
								**${interaction.member.user.username}** wagered **${amount}** on **${
									selectedOption.title
								}**`
							)
							.setFooter(`Total Pot: ${updatedBet.pot + amount}`)
							.setAuthor(
								`${bet.title}`,
								'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
							),
					],
				});
			});

		collector.stop();
	});
}

async function closeBet(interaction, bet) {
	if (interaction.user.id !== bet.ownerId) {
		interaction.guild.members.fetch(bet.ownerId).then((owner) => {
			interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor('#c41616')
						.setDescription(`Only ${owner} can close this bet.`),
				],
				ephemeral: true,
			});
		});
	} else if (bet.open) {
		const openBet = await betModel.findOneAndUpdate(
			{ _id: bet.id },
			{ $set: { open: false } }
		);

		interaction.channel.messages.fetch(bet.messageId).then((message) => {
			message.edit({
				embeds: [
					new MessageEmbed()
						.setColor('#c41616')
						.setDescription(
							`${message.embeds[0].description ?? ''}

							**Bets Closed!**

							Waiting for ${interaction.member} to pick a winner.
							Total Pot: ${openBet.pot}`
						)
						.setAuthor(
							`${bet.title}`,
							'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
						),
				],
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
		});
	} else if (!bet.open && !bet.paid) {
		let description = `**Type the corresponding number for the winner option:**\n`;
		bet.options.forEach((option, i) => {
			description += `\n[ ${i} ]   **${option.title}**`;
		});

		interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('#34eba1')
					.setDescription(description),
			],
			ephemeral: true,
		});

		const options = bet.options.map((option) => option.title);
		const filter = async (message) => {
			if (
				message.content &&
				options[message.content] &&
				message.member.id === bet.ownerId &&
				!message.author.bot
			)
				return true;

			if (message.member.id === bet.ownerId)
				message.reply({
					embeds: [
						new MessageEmbed()
							.setColor('#34eba1')
							.setDescription(
								`Type only the corresponding number for the winner option.`
							),
					],
					ephemeral: true,
				});

			return false;
		};

		const collector = new MessageCollector(interaction.channel, {
			filter: filter,
			max: 1,
			time: client.config.betDuration,
		});

		collector.on('collect', async (message) => {
			const winnerOption = options[message.content];

			const updatedBet = await betModel.findOneAndUpdate(
				{ _id: bet.id },
				{
					$set: {
						paid: true,
						winner: winnerOption,
					},
				}
			);

			updatedBet.options.forEach(async (option) => {
				if (option.title === winnerOption) {
					option.users.forEach(async (user) => {
						let percentage = user.bet / option.pot;
						let winnings =
							user.bet +
							Math.floor(
								(updatedBet.pot - option.pot) * percentage
							);

						let userData = await userModel.findOneAndUpdate(
							{
								userId: user.id,
							},
							{ $inc: { coins: winnings, betsWon: 1 } }
						);

						let topBalance = userData.topBalance;
						if (userData.coins + winnings > topBalance) {
							topBalance = userData.coins;
						}

						let topWin = userData.topWin;
						if (winnings > userData.topWin) {
							topWin = winnings;
						}

						await userModel.findOneAndUpdate(
							{
								userId: user.id,
							},
							{
								$set: {
									topBalance: topBalance,
									topWin: topWin,
								},
							}
						);
					});
				} else {
					option.users.forEach(async (user) => {
						let userData = await userModel.findOne({
							userId: user.id,
						});

						let update = {
							$inc: {
								betsLost: 1,
							},
						};

						if (userData.coins === 0) {
							update = {
								$inc: {
									betsLost: 1,
									timesBankrupt: 1,
								},
							};
						}

						await userModel.findOneAndUpdate(
							{
								userId: user.id,
							},
							update
						);
					});
				}
			});

			interaction.channel.messages
				.fetch(bet.messageId)
				.then((message) => {
					message.edit({
						embeds: [
							new MessageEmbed()
								.setColor('#c41616')
								.setDescription(
									`${message.embeds[0].description ?? ''}

									**Bets Closed!**
	 
									Total Pot: ** ${updatedBet.pot} **
									Result: ** ${winnerOption} **`
								)
								.setAuthor(
									`${updatedBet.title}`,
									'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
								),
						],
						components: [],
					});
				});
		});
	}
}

async function cancelBet(interaction, bet) {
	if (interaction.user.id !== bet.ownerId) {
		interaction.guild.members.fetch(bet.ownerId).then((owner) => {
			interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor('#c41616')
						.setDescription(`Only ${owner} can cancel this bet.`),
				],
				ephemeral: true,
			});
		});
	} else if (bet.cancelled) {
		interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor('#c41616')
					.setDescription(`This bet has already been cancelled.`),
			],
			ephemeral: true,
		});
	} else {
		const updatedBet = await betModel.findOneAndUpdate(
			{ _id: bet.id },
			{ $set: { cancelled: true } }
		);

		updatedBet.options.forEach((option) => {
			option.users.forEach(async (user) => {
				await userModel.findOneAndUpdate(
					{
						userId: user.id,
					},
					{ $inc: { coins: user.bet } }
				);
			});
		});

		interaction.channel.messages.fetch(bet.messageId).then((message) => {
			message.edit({
				embeds: [
					new MessageEmbed()
						.setColor('#c41616')
						.setDescription(
							`**Bet Cancelled!**
							All points were returned.`
						)
						.setAuthor(
							`${bet.title}`,
							'https://cdn.betterttv.net/emote/5f32709e8abf185d76c688f9/3x'
						),
				],
				components: [],
			});
		});
	}
}
