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

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const auth = require('./lib/auth');
const index = require('./routes/index');
const users = require('./routes/users');
const catalog = require('./routes/catalog'); 

const app = express();

// Set up mongoose connection
const mongoose = require('mongoose');
const dev_db_url = 'INSERT_VALID_URL_HERE';
const mongoDB = dev_db_url;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// Authentication Packages
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const flash = require('express-flash');
const MongoStore = require('connect-mongo');
const user = require('./models/user');

// Configure the local strategy for use by Passport.
passport.use(new LocalStrategy(
  async function (username, password, callback) {
    let user;
    try {
      user = await User.findOne({ username: username }).exec();
      if (!user) {
        return callback(null, false, { message: 'Incorrect username.' });
      }
    } catch (e) {
      return callback(e);
    }
    const match = await user.validatePassword(password);
    if (!match) {
      return callback(null, false, { message: 'Incorrect password.' });
    }
    return callback(null, user);
  }
));

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, callback) {
  callback(null, user._id);
});

passport.deserializeUser(async (id, callback) => {
  try {
    let user = await User.findById(id).exec();
    if (!user) {
      return callback(new Error('User not found.'));
    }
    callback(null, user);
  } catch (e) {
    callback(e);
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication related middleware.
app.use(flash());

app.use(session({
  secret: 'library-session-secret',
  saveUninitialized: false, // don't create session until something stored
  resave: false, //don't save session if unmodified
  store: MongoStore.create({
    mongoUrl: mongoDB,
    touchAfter: 24 * 3600 // time period in seconds
  })
}));

// Initialize Passport and restore authentication state, if any,
// from the session.
app.use(passport.initialize());
app.use(passport.session());

// Pass isAuthenticated and current_user to all views.
app.use(function(req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  // Delete salt and hash fields from req.user object before passing it.
  var safeUser = req.user;
  if (safeUser) {
    delete safeUser._doc.salt;
    delete safeUser._doc.hash;
  }
  res.locals.current_user = safeUser;
  next();
});

// Use our Authentication and Authorization middleware.
app.use(auth);

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;