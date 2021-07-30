const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
	first_name: { type: String, required: true, maxLength: 100 },
	family_name: { type: String, required: true, maxLength: 100 },
	date_of_birth: { type: Date },
	date_of_death: { type: Date },
}, {timestamps: true});

// Virtual for author's full name
AuthorSchema.virtual('name').get(function () {
	return this.first_name + ' ' + this.family_name;
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get(function () {
	let lifetime_string = '';
	if (this.date_of_birth) {
		lifetime_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(
			DateTime.DATE_MED
		);
	}
	lifetime_string += ' - ';
	if (this.date_of_death) {
		lifetime_string += DateTime.fromJSDate(this.date_of_death).toLocaleString(
			DateTime.DATE_MED
		);
	}
	return lifetime_string;
});

// Virtual for author's URL
AuthorSchema.virtual('url').get(function () {
	return '/catalog/author/' + this._id;
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
