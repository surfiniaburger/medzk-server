const express = require('express');
const passport = require('passport');
const User = require('../models/user');
const router = express.Router();

// Signup route
router.post('/signup', (req, res) => {
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      passport.authenticate('local')(req, res, () => {
        res.json({ success: true, user: user });
      });
    }
  });
});

// Login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.json({ success: true });
});

module.exports = router;
