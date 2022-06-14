const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();

module.exports = (req, res, next) => {
  try {
    // Get token from request header
    const token = req.headers.authorization.split(' ')[1];
    // Decode token
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
    // Get userId from decoded token
    const userId = decodedToken.userId;
    // Add auth object to request containing userId 
    req.auth = { userId };
    // Check userId 
    if (req.body.userId && req.body.userId !== userId) {
      throw 'userId incorrect';
    } else {
      next();
    }
  } catch(error) {
    res.status(401).json({ error });
  }
};