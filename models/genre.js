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

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GenreSchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 },
});

// Virtual for this genre instance URL.
GenreSchema.virtual("url").get(function () {
  return "/catalog/genre/" + this._id;
});

// Export model.
module.exports = mongoose.model("Genre", GenreSchema);