const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

const MY_TOKEN_KEY = process.env.TOKEN_KEY;


module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, MY_TOKEN_KEY);
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId) {
      throw 'userId incorrect';
    } else {
      next();
    }
  } catch(error) {
    res.status(401).json({ error });
  }
};