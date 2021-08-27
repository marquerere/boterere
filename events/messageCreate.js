const client = require('../index');
const userModel = require('../models/userSchema');

client.on('messageCreate', async (message) => {
	if (
		message.author.bot ||
		!message.guild ||
		!message.content.toLowerCase().startsWith(client.config.prefix)
	)
		return;

	const [cmd, ...args] = message.content
		.slice(client.config.prefix.length)
		.trim()
		.match(/("[^"]+"|'[^']+'|[^"\s]+)/g)
		.map((arg) => arg.replace(/'|"/g, ''));

	const command =
		client.commands.get(cmd.toLowerCase()) ||
		client.commands.find((c) => c.aliases?.includes(cmd.toLowerCase()));

	if (!command) return;

	let userData;
	try {
		userData = await userModel.findOne({
			userId: message.author.id,
		});
	} catch (err) {
		console.log(err);
	}

	await command.run(client, message, args, userData);
});
