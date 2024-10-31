// middleware/apigeeAuth.js
const apigeeAuth = (req, res, next) => {
    // Only add the Apigee API key for routes calling the Apigee proxy
    if (req.path === '/api/register') {
      req.headers['apikey'] = process.env.APIGEE_API_KEY;
    }
    next();
  };
  
  module.exports = apigeeAuth;
  