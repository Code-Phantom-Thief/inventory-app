const Category = require('../models/category');
const Song = require('../models/song');
const async = require('async');
const { body, validationResult } = require('express-validator');

// Display list of all category.
exports.category_list = (req, res, next) => {
	Category.find()
		.sort([['name', 'ascending']])
		.exec((err, list_categories) => {
			if (err) {
				return next(err);
			}
			//Successful, so render
			res.render('category_list', {
				title: 'Category List',
				category_list: list_categories,
			});
		});
};

// Display detail page for a specific category.
exports.category_detail = (req, res, next) => {
	async.parallel(
		{
			category: (callback) => {
				Category.findById(req.params.id).exec(callback);
			},
			category_songs: (callback) => {
				Song.find({ category: req.params.id }).exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			if (results.category === null) {
				const err = new Error('Category not found');
				err.status = 404;
				return next(err);
			}
			res.render('category_detail', {
				title: 'Category Detail',
				category: results.category,
				category_songs: results.category_songs,
			});
		}
	);
};

// Display category create form on GET.
exports.category_create_get = (req, res) => {
	res.render('category_form', { title: 'Create Category' });
};

// Handle Category create on POST.
exports.category_create_post = [
	// Validate and santize the name field.
	body('name', 'Category name required')
		.trim()
		.isLength({ min: 1 })
		.isAlphanumeric()
		.withMessage('Category is non-alphanumeric characters.')
		.escape(),

	// Process request after validation and sanitization.
	(req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validationResult(req);

		// Create a category object with escaped and trimmed data.
		let category = new Category({ name: req.body.name });

		if (!errors.isEmpty()) {
			// There are errors. Render the form again with sanitized values/error messages.
			res.render('category_form', {
				title: 'Create Category',
				category: category,
				errors: errors.array(),
			});
			return;
		} else {
			// Data from form is valid.
			// Check if category with same name already exists.
			Category.findOne({ name: req.body.name }).exec(function (
				err,
				found_category
			) {
				if (err) {
					return next(err);
				}

				if (found_category) {
					// category exists, redirect to its detail page.
					res.redirect(found_category.url);
				} else {
					category.save(function (err) {
						if (err) {
							return next(err);
						}
						// category saved. Redirect to category detail page.
						res.redirect(category.url);
					});
				}
			});
		}
	},
];

// Display category delete form on GET.
exports.category_delete_get = (req, res, next) => {
	async.parallel(
		{
			category: (callback) => {
				Category.findById(req.params.id).exec(callback);
			},
			categories_songs: (callback) => {
				Song.find({ 'category': req.params.id }).exec(callback);
			},
		},
		(err, results) => {
			if (err) {
				return next(err);
			}
			if (results.category === null) {
				res.redirect('/catalog/categories');
			}
			res.render('category_delete', {
				title: 'Delete Category',
				category: results.category,
				category_songs: results.categories_songs,
			});
		}
	);
};

// Handle category delete on POST.
exports.category_delete_post = (req, res, next) => {
	async.parallel({
		category: (callback) => {
			Category.findById(req.body.categoryid).exec(callback);
		},
		categories_songs: (callback) => {
			Song.find({ 'category': req.body.categoryid }).exec(callback);
		}
	}, (err, results) => {
		if (err) { return next(err); }
		if (results.categories_songs.length > 0) {
			res.render('category_delete', { title: 'Delete Category', category: results.category, category_songs: results.categories_songs });
			return;
		} else {
			Category.findByIdAndRemove(req.body.categoryid, function deleteCategory(err) {
				if (err) { return next(err); }
				res.redirect('/catalog/categories');
			})
		}
	})
};

// Display category update form on GET.
exports.category_update_get = (req, res) => {
	res.send('NOT IMPLEMENTED: category update GET');
};

// Handle category update on POST.
exports.category_update_post = (req, res) => {
	res.send('NOT IMPLEMENTED: category update POST');
};
