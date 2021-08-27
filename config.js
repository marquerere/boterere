require('dotenv').config();

module.exports = {
	token: process.env.BOT_TOKEN,
	mongooseConnectionString: process.env.MONGOOSE,
	prefix: '.',

	startingBalance: 1000,
	betDuration: 120000,
};
