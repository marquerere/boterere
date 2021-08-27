const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
	ownerId: { type: String, required: true },
	messageId: { type: String, default: '' },

	title: { type: String, required: true },
	options: { type: Array, default: [] },
	users: { type: Array, default: [] },
	pot: { type: Number, default: 0 },

	open: { type: Boolean, default: true },
	cancelled: { type: Boolean, default: false },
	paid: { type: Boolean, default: false },
	winner: { type: String, default: '' },
});

module.exports = mongoose.model('BetModels', betSchema);
