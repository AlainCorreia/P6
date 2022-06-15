const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userValidation = require('../validation/user');
require('dotenv').config();

exports.signup = (req, res, next) => {
  // Request validation
  const validation = userValidation.schema.validate(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  // Hash password and save user to database
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'User created.' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  // Request validation
  const validation = userValidation.schema.validate(req.body);
  if (validation.error) return res.status(400).json({ error: validation.error });
  User.findOne({ email: req.body.email })
    .then(user => {
      // If email adress not in database
      if(!user) return res.status(401).json({ error: 'Email address unknown.' });
      // Check password
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if(!valid) return res.status(401).json({ error: 'Password is incorrect.' });
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              process.env.TOKEN_KEY,
              { expiresIn: '24h' }
            )
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};
