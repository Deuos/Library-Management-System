/*
    Library Management System
    Group 3
	Owen Bessette, Chris Gerk,
	Jin Lee, Kush Patel, and Sereyvichea Phan
    Professor Gao
	CSC-445-01 Software Engineering
	
	Code sourced and modified from
	MDN Express web framework (Node.js/JavaScript)
	learning resources for beginning developers and students
	https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs
*/

const express = require('express');
const router = express.Router();

// GET home page.
router.get('/', function(req, res) {
  res.redirect('/catalog');
});

module.exports = router;