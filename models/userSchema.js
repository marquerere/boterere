const mongoose = require('mongoose');
const config = require('../config.js');

const userSchema = new mongoose.Schema({
	userId: { type: String, required: true, unique: true },
	serverId: { type: String, required: true },

	coins: { type: Number, default: config.startingBalance },
	coinsGifted: { type: Number, default: 0 },

	betsWon: { type: Number, default: 0 },
	betsLost: { type: Number, default: 0 },
	timesBankrupt: { type: Number, default: 0 },

	topWin: { type: Number, default: 0 },
	topBalance: { type: Number, default: config.startingBalance },
});

module.exports = mongoose.model('UserModels', userSchema);
