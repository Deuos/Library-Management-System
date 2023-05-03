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

// Require user model
const User = require('../models/user');

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const passport = require('passport');

// Display detail page for a specific user.
exports.user_profile = [
  isPageOwnedByUser,

  asyncHandler(async (req, res, next) => {
    const found_user = await User.findById(req.params.id).exec();
    if (found_user == null) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('user_profile', {
      title: 'User Profile',
      user: found_user
    });
  }),
];

// Display login form on GET.
exports.login_get = [
  isAlreadyLoggedIn,

  function(req, res, next) {
    var messages = extractFlashMessages(req);
    res.render('user_login', {
      title: 'Login',
      errors: messages.length > 0 ? messages : null
    });
  }
];

// Display warning page on GET.
exports.warning = [
  function(req, res, next) {
    var messages = extractFlashMessages(req);
    res.render('user_warning', {
      title: 'Sorry!',
      errors: messages.length > 0 ? messages : null
    });
  }
];

// Handle login form on POST
exports.login_post = [
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })
];

// Handle logout on GET.
exports.logout_get = [
  function(req, res, next) {
    req.logout(function (err) {
      if (err) { return next(err); }
      req.session.destroy(function (err) {
        res.redirect('/');
      })
    })
  }
];

// Display register form on GET.
exports.register_get = [
  isAlreadyLoggedIn,

  // Continue processing.
  function(req, res, next) {
    res.render('user_form', {
      title: 'Create User'
    });
  }
];

// Handle register on POST.
exports.register_post = [
  // Validate and sanitize fields.
  body("username")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Username must be at least 3 characters long.")
    .isAlphanumeric()
    .withMessage("Username has non-alphanumeric characters."),
  body("fullname")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Full name must be at least 3 characters long.")
    .isAlphanumeric('en-US', {ignore: ' '})
    .withMessage("Full name has non-alphanumeric characters."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address."),
  body("role")
    .trim()
    .isInt({ min: 0, max: 2 })
    .withMessage("A role must be selected for the user."),
  body("password", "password_confirm")
    .trim()
    .isLength({ min: 4, max: 32 })
    .escape()
    .withMessage("Password must be between 4-32 characters long.")
    .isAlphanumeric()
    .withMessage("Password has non-alphanumeric characters."),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a user object with escaped and trimmed data.
    const user = new User({
      username: req.body.username,
      fullname: req.body.fullname,
      email: req.body.email,
      role: Number.parseInt(req.body.role),
    });

    // Check if passwords match or not.
    const errorArray = errors.array();
    if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
      errorArray.push({ msg: 'Passwords do not match.' })
    }

    if (errorArray.length) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('user_form', {
        title: 'Create User',
        user: user,
        errors: errorArray
      });
      return;
    } else {
      // Passwords match. Set password.
      await user.setPassword(req.body.password);

      // Check if User with same username already exists.
      const userExists = await User.findOne({ username: req.body.username });
      if (userExists) {
        // Username exists, re-render the form with error message.
        res.render('user_form', {
          title: 'Create User',
          user: user,
          errors: [{ msg: 'Username already taken. Choose another one.' }]
        });
      } else {
        // User does not exist. Create it.
        await user.save();
        // User saved. Redirect to login page.
        req.flash('success', 'Successfully registered. You can log in now!');
        res.redirect('/users/login');
      }
    }
  }),
];

// Display update form on GET.
exports.update_get = [
  isPageOwnedByUser,

  asyncHandler(async (req, res, next) => {
    const found_user = await User.findById(req.params.id).exec();
    if (found_user == null) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render('user_form', {
      title: 'Update User',
      user: found_user,
      is_update_form: true
    });
  }),
];

// Handle update on POST.
exports.update_post = [
  // Validate and sanitize fields.
  body("username")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Username must be at least 3 characters long.")
    .isAlphanumeric()
    .withMessage("Username has non-alphanumeric characters."),
  body("fullname")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Full name must be at least 3 characters long.")
    .isAlphanumeric('en-US', {ignore: ' '})
    .withMessage("Full name has non-alphanumeric characters."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address."),
  body("role")
    .trim()
    .isInt({ min: 0, max: 2 })
    .withMessage("A role must be selected for the user."),
  body("password", "password_confirm")
    .trim()
    .isLength({ min: 4, max: 32 })
    .escape()
    .withMessage("Password must be between 4-32 characters long.")
    .isAlphanumeric()
    .withMessage("Password has non-alphanumeric characters."),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a user object with escaped and trimmed data and the old _id!
    var user = new User({
      username: req.body.username,
      fullname: req.body.fullname,
      email: req.body.email,
      role: Number.parseInt(req.body.role),
      _id: req.params.id
    });

    const errorArray = errors.array();
    if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
      errorArray.push({ msg: 'Passwords do not match.' })
    }

    if (errorArray.length) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('user_form', {
        title: 'Update User',
        user: user,
        errors: errorArray,
        is_update_form: true
      });
      return;
    } else {
      // Passwords match. Set password.
      user.setPassword(req.body.password);

      // Data from form is valid. Update the record.
      const found_user = await User.findByIdAndUpdate(req.params.id, user, {});
      if (found_user === null) {
        // No results.
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
      }
      // Successful - redirect to user detail page.
      const userPage = '/users/' + req.params.id;
      res.redirect(userPage);
    }
  })
];

// Display reset password form on GET.
exports.reset_get = [
  isAlreadyLoggedIn,

  function(req, res, next) {
    res.render('user_reset', {
      title: 'Reset Password',
      is_first_step: true
    });
  }
];

// Handle reset password on POST (1st step).
exports.reset_post = [
  // First step of the password reset process.
  // Take username and email from form, and try to find a matching user.

  // Validate fields.
  body("username")
  .trim()
  .isLength({ min: 3 })
  .escape()
  .withMessage("Username must be at least 3 characters long.")
  .isAlphanumeric()
  .withMessage("Username has non-alphanumeric characters."),
  body("email")
  .trim()
  .isEmail()
  .withMessage("Please enter a valid email address."),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a user object with escaped and trimmed data.
    const user = new User({
      username: req.body.username,
      email: req.body.email
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      // The user couldn't pass this step yet. Hence we're still in the first step!
      res.render('user_reset', {
        title: 'Reset Password',
        is_first_step: true,
        user: user, // Pass user object created with user-entered values.
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Check if User exists.
      const found_user = await User.findOne({ username: req.body.username, email: req.body.email });
      if (found_user == null) {
        // User does not exist or credentials didn't match.
        // Render the form again with error messages. Still first step!
        res.render('user_reset', {
          title: 'Reset Password',
          is_first_step: true,
          user: user, // Pass user object created with user-entered values.
          errors: [{ msg: 'The user does not exist or credentials did not match a user. Try again.' }]
        });
      }
      // User exists and credentials did match. Proceed to the second step.
      // And pass found_user to the form. We'll need user._id in the final step.
      res.render('user_reset', {
        title: 'Reset Password',
        is_second_step: true,
        user: found_user // Pass found_user.
      });
    }
  })
];

// Handle reset password on POST (2nd step).
exports.reset_post_final = [
  // Second and the final step of the password reset process.
  // Take userid, password and password_confirm fields from form,
  // and update the User record.

  body("password", "password_confirm")
  .trim()
  .isLength({ min: 4, max: 32 })
  .escape()
  .withMessage("Password must be between 4-32 characters long.")
  .isAlphanumeric()
  .withMessage("Password has non-alphanumeric characters."),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a user object containing only id field, for now.
    // We need to use old _id, which is coming from found_user passed in the first step.
    var user = new User({
      _id: req.body.userid
    });

    // Check if passwords match or not.
    const errorArray = errors.array();
    if (!user.passwordsMatch(req.body.password, req.body.password_confirm)) {
      errorArray.push({ msg: 'Passwords do not match.' })
    }

    if (errorArray.length) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('user_reset', {
        title: 'Reset Password',
        is_second_step: true,
        user: user, // We need to pass user back to form because we will need user._id in the next step.
        errors: errorArray,
      });
      return;
    } else {
      // Data from form is valid.

      // Passwords match. Set password.
      await user.setPassword(req.body.password);

      // Update the record.
      const found_user = await User.findById(req.body.userid).exec();
      if (found_user === null) {
        // No results.
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
      }
      user.role = found_user.role;
      await User.findByIdAndUpdate(req.body.userid, user, {}).exec();
      // Success, redirect to login page and show a flash message.
      req.flash('success', 'You have successfully changed your password. You can log in now!');
      res.redirect('/users/login');
    }
  })
];

// -- Helper functions, no need to export. -- //

// Extract flash messages from req.flash and return an array of messages.
function extractFlashMessages(req) {
  var messages = [];
  // Check if flash messages was sent. If so, populate them.
  var errorFlash = req.flash('error');
  var successFlash = req.flash('success');

  // Look for error flash.
  if (errorFlash && errorFlash.length) messages.push({ msg: errorFlash[0] });

  // Look for success flash.
  if (successFlash && successFlash.length) messages.push({ msg: successFlash[0] });
  
  return messages;
}

// Function to prevent user who already logged in from
// accessing login and register routes.
function isAlreadyLoggedIn(req, res, next) {
  if (req.user && req.isAuthenticated()) {
    res.redirect('/');
  } else {
    next();
  }
}

// Function that confirms that user is logged in and is the 'owner' of the page.
function isPageOwnedByUser(req, res, next) {
  if (req.user && req.isAuthenticated()) {
    if (req.user._id.toString() === req.params.id.toString()) {
      // User's own page. Allow request.
      next();
    } else {
      // Deny and redirect.
      res.redirect('/');
    }
  } else {
    // Not authenticated. Redirect.
    res.redirect('/');
  }
}