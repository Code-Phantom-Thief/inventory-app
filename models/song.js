const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SongSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	author: {
		type: Schema.Types.ObjectId,
		ref: 'Author',
		required: true,
	},
	summary: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	stock: {
		type: Number,
		required: true,
	},
	image: {
		data: Buffer,
		contentType: String,
	},
	category: [
		{
			type: Schema.Types.ObjectId,
			ref: 'Category',
		},
	],
});

SongSchema.virtual('url').get(function () {
	return '/catalog/song/' + this._id;
});

module.exports = mongoose.model('Song', SongSchema);
