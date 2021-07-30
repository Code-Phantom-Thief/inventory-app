const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const song_controller = require('../controllers/songController');
const author_controller = require('../controllers/authorController');
const category_controller = require('../controllers/categoryController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../public/images/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
const upload = multer({ storage: storage })

/// ********** Song ROUTES **********///
// GET catalog home page.
router.get('/', song_controller.index);

// GET request for creating a song. NOTE This must come before routes that display song (uses id).
router.get('/song/create', song_controller.song_create_get);

// POST request for creating song.
router.post('/song/create', upload.single('image'), song_controller.song_create_post);

// GET request to delete song.
router.get('/song/:id/delete', song_controller.song_delete_get);

// POST request to delete song.
router.post('/song/:id/delete', song_controller.song_delete_post);

// GET request to update song.
router.get('/song/:id/update', song_controller.song_update_get);

// POST request to update song.
router.post('/song/:id/update', song_controller.song_update_post);

// GET request for one song.
router.get('/song/:id', song_controller.song_detail);

// GET request for list of all song items.
router.get('/songs', song_controller.song_list);


/// **********AUTHOR ROUTES **********///
// GET request for creating Author. NOTE This must come before route for id (i.e. display author).
router.get('/author/create', author_controller.author_create_get);

// POST request for creating Author.
router.post('/author/create', author_controller.author_create_post);

// GET request to delete Author.
router.get('/author/:id/delete', author_controller.author_delete_get);

// POST request to delete Author.
router.post('/author/:id/delete', author_controller.author_delete_post);

// GET request to update Author.
router.get('/author/:id/update', author_controller.author_update_get);

// POST request to update Author.
router.post('/author/:id/update', author_controller.author_update_post);

// GET request for one Author.
router.get('/author/:id', author_controller.author_detail);

// GET request for list of all Authors.
router.get('/authors', author_controller.author_list);


/// **********Category ROUTES **********///
// GET request for creating a category. NOTE This must come before route that displays category (uses id).
router.get('/category/create', category_controller.category_create_get);

//POST request for creating category.
router.post('/category/create', category_controller.category_create_post);

// GET request to delete category.
router.get('/category/:id/delete', category_controller.category_delete_get);

// POST request to delete category.
router.post('/category/:id/delete', category_controller.category_delete_post);

// GET request to update category.
router.get('/category/:id/update', category_controller.category_update_get);

// POST request to update category.
router.post('/category/:id/update', category_controller.category_update_post);

// GET request for one category.
router.get('/category/:id', category_controller.category_detail);

// GET request for list of all category.
router.get('/categories', category_controller.category_list);




module.exports = router;