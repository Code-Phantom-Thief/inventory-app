const Song = require('../models/song');
const Author = require('../models/author');
const Category = require('../models/category');
const async = require('async');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

exports.index = (req, res) => {
	async.parallel(
		{
			song_count: (callback) => {
				Song.countDocuments({}, callback);
			},
			author_count: (callback) => {
				Author.countDocuments({}, callback);
			},
			category_count: (callback) => {
				Category.countDocuments({}, callback);
			},
		},
		(err, results) => {
			res.render('index', {
				title: 'Music Inventory Home',
				error: err,
				data: results,
			});
		}
	);
};

// Display list of all songs.
exports.song_list = (req, res, next) => {
	Song.find({}, 'title author').exec((err, list_songs) => {
		if (err) {
			return next(err);
		}
		res.render('song_list', { title: 'Song List', song_list: list_songs });
	});
};

// Display detail page for a specific song.
exports.song_detail = (req, res, next) => {
	async.parallel(
		{
			song: (callback) => {
				Song.findById(req.params.id)
					.populate('author')
					.populate('category')
					.exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			if (results.song === null) {
				const err = new Error('Song not found');
				err.status = 404;
				return next(err);
			}
			res.render('song_detail', {
				title: results.song.title,
				song: results.song,
			});
		}
	);
};

// Display song create form on GET.
exports.song_create_get = (req, res, next) => {
	// Get all authors and categories, which we can use for adding to our song
	async.parallel(
		{
			authors: (callback) => {
				Author.find(callback);
			},
			categories: (callback) => {
				Category.find(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			res.render('song_form', {
				title: 'Create Song',
				authors: results.authors,
				categories: results.categories,
			});
		}
	);
};

// Handle song create on POST.
exports.song_create_post = [
	// Convert the category to an array.
	(req, res, next) => {
		if (!(req.body.category instanceof Array)) {
			if (typeof req.body.category === 'undefined') req.body.category = [];
			else req.body.category = new Array(req.body.category);
		}
		next();
	},
	// Validate and sanitise fields.
	body('title', 'Title must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('author', 'Author must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('summary', 'Summary must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('price', 'Price must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('stock', 'Stock must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('image', 'Image must not be empty').escape(),
	body('category.*').escape(),

	// Process request after validation and sanitization.
	(req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		const obj = {
			img: {
				data: fs.readFileSync(`public/images/${req.file.filename}`),
				contentType: 'image/jpeg/png',
			},
		};
		// Create a Song object with escaped and trimmed data.
		let song = new Song({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			price: req.body.price,
			stock: req.body.stock,
			category: req.body.category,
			image: obj.img,
		});

		if (!errors.isEmpty()) {
			// There are errors.
			// Render form again with sanitized values / error messages.

			// Get all authors and categories for form.
			async.parallel(
				{
					authors: (callback) => {
						Author.find(callback);
					},
					categories: (callback) => {
						Category.find(callback);
					},
				},
				(err, results) => {
					if (err) {
						return next(err);
					}
					// Mark our selected categories as checked.
					for (let i = 0; i < results.category.length; i++) {
						if (song.category.indexOf(results.categories[i]._id) > -1) {
							results.categories[i].checked = 'true';
						}
					}
					res.render('song_form', {
						title: 'Create Song',
						authors: results.authors,
						categories: results.categories,
						song: song,
						errors: errors.array(),
					});
				}
			);
			return;
		} else {
			// Data from form is valid. Save song.
			song.save((err) => {
				if (err) {
					return next(err);
				}
				//successful - redirect to new song record.
				res.redirect(song.url);
			});
		}
	},
];

// Display song delete form on GET.
exports.song_delete_get = (req, res, next) => {
	async.parallel(
		{
			song: (callback) => {
				Song.findById(req.params.id).exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			if (results.song === null) {
				res.redirect('/catalog/songs');
			}
			res.render('song_delete', { title: 'Delete Song', song: results.song });
		}
	);
};

// Handle song delete on POST.
exports.song_delete_post = (req, res, next) => {
	async.parallel(
		{
			song: (callback) => {
				Song.findById(req.body.songid)
					.populate('author')
					.populate('category')
					.exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			Song.findByIdAndRemove(req.body.songid, function deleteSong(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/catalog/songs');
			});
		}
	);
};

// Display song update form on GET.
exports.song_update_get = function (req, res, next) {
	// Get song, authors and categories for form.
	async.parallel(
		{
			song: function (callback) {
				Song.findById(req.params.id)
					.populate('author')
					.populate('category')
					.exec(callback);
			},
			authors: function (callback) {
				Author.find(callback);
			},
			categories: function (callback) {
				Category.find(callback);
			},
		},
		function (err, results) {
			if (err) {
				return next(err);
			}
			if (results.book === null) {
				const err = new Error('Song not found');
				err.status = 404;
				return next(err);
			}
			// Success.
			// Mark our selected categories as checked.
			for (
				let all_g_iter = 0;
				all_g_iter < results.categories.length;
				all_g_iter++
			) {
				for (
					let song_g_iter = 0;
					song_g_iter < results.song.category.length;
					song_g_iter++
				) {
					if (
						results.categories[all_g_iter]._id.toString() ===
						results.song.category[song_g_iter]._id.toString()
					) {
						results.categories[all_g_iter].checked = 'true';
					}
				}
			}
			res.render('song_form', {
				title: 'Update Song',
				authors: results.authors,
				categories: results.categories,
				song: results.song,
			});
		}
	);
};

// Handle Song update on POST.
exports.song_update_post = [
	// Convert the category to an array
	(req, res, next) => {
		if (!(req.body.category instanceof Array)) {
			if (typeof req.body.category === 'undefined') req.body.category = [];
			else req.body.category = new Array(req.body.category);
		}
		next();
	},
	// Validate and sanitise fields.
	body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
	body('author', 'Author must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('summary', 'Summary must not be empty.')
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body('price', 'Price must not be empty').trim().isLength({ min: 1 }).escape(),
	body('stock', 'Stock must not be empty').trim().isLength({ min: 1 }).escape(),
	body('image', 'Image must not be empty').escape(),
	body('category.*').escape(),

	// Process request after validation and sanitization.
	(req, res, next) => {
		// Extract the validation errors from a request.
		// Create a Book object with escaped/trimmed data and old id.

		let song = new Song({
			title: req.body.title,
			author: req.body.author,
			summary: req.body.summary,
			price: req.body.price,
			stock: req.body.stock,
			category:
				typeof req.body.category === 'undefined' ? [] : req.body.category,
			image: req.body.image,
			_id:req.params.id
		});

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/error messages.

			// Get all authors and genres for form.
			async.parallel(
				{
					authors: function (callback) {
						Author.find(callback);
					},
					categories: function (callback) {
						Category.find(callback);
					},
				},
				function (err, results) {
					if (err) {
						return next(err);
					}

					// Mark our selected categories as checked.
					for (let i = 0; i < results.categories.length; i++) {
						if (song.category.indexOf(results.categories[i]._id) > -1) {
							results.categories[i].checked = 'true';
						}
					}
					res.render('song_form', {
						title: 'Update Song',
						authors: results.authors,
						categories: results.categories,
						song: song,
						errors: errors.array(),
					});
				}
			);
			return;
		} else {
			// Data from form is valid. Update the record.
			Song.findByIdAndUpdate(req.params.id, song, {}, function (err, thesong) {
				if (err) {
					return next(err);
				}
				// Successful - redirect to Song detail page.
				res.redirect(thesong.url);
			});
		}
	},
];
