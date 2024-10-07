const express = require('express');
const router = express.Router();

const { SignUp } = require('../controllers/auth');

router.post('/signup', SignUp);

module.exports = router;
