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

// Define allowed operations for roles.
// 0: User
// 1: Editor
// 2: Admin
const roles = {
  0: ['read'],
  1: ['read', 'create', 'update'],
  2: ['read', 'create', 'update', 'delete']
};

// Catch all requests pointed to 'delete' or 'update' page of our catalog entities,
// and run them through our authentication/authorization middleware chain.
// This route requires 'update' or 'delete' permission.
// e.g. /catalog/author/:id/update
router.use(/^\/catalog\/(author|book|bookinstance|genre)\/([a-zA-Z0-9]{1,})\/(delete|update)/, [
  function(req, res, next) {
    // Get the operation from req.params object.
    req.requested_operation = req.params[2].toLowerCase();
    next();
  },
  confirmAuthentication,
  confirmRole
]);

// Catch all requests pointed to 'create' page of our catalog entities,
// and run them through our authentication/authorization middleware chain.
// This route requires 'create' permission.
// e.g. /catalog/book/create
router.use(/^\/catalog\/(author|book|bookinstance|genre)\/(create)/, [
  function(req, res, next) {
    // Get the operation from req.params object.
    req.requested_operation = req.params[1].toLowerCase();
    next();
  },
  confirmAuthentication,
  confirmRole
]);

// Catch all requests pointed to detail page of our catalog entities,
// and run them through our authentication/authorization middleware chain.
// This route requires 'read' permission.
// e.g. /catalog/author/:id
router.use(/^\/catalog\/(author|book|bookinstance|genre)\/([a-zA-Z0-9]{1,})/, [
  function(req, res, next) {
    // Use hard-coded operation.
    req.requested_operation = 'read';
    next();
  },
  confirmAuthentication,
  confirmRole
]);

// Confirms that the user is authenticated.
function confirmAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    // Authenticated. Proceed to next function in the middleware chain.
    return next();
  } else {
    // Not authenticated. Redirect to login page and flash a message.
    req.flash('error', 'You need to login first!');
    res.redirect('/users/login');
  }
}

// Confirms that the user has appropriate permission.
function confirmRole(req, res, next) {
  const userRole = Number.parseInt(req.user.role);
  const operation = req.requested_operation;
  if (roles[userRole].includes(operation)) {
    // User has required permission.
    return next();
  } else {
    // User does not have required permission. Redirect.
    req.flash('error', "You're not authorized to access this page!");
    res.redirect('/users/stop');
  }
}

module.exports = router;