const appleSignin = require('apple-signin-auth');

/**
 * Verify an Apple identity_token (JWT) and return the decoded payload.
 * Fetches Apple's public JWKS automatically.
 */
const verifyIdToken = (idToken) =>
  appleSignin.verifyIdToken(idToken, {
    audience: process.env.APPLE_CLIENT_ID,
    ignoreExpiration: false,
  });

module.exports = { verifyIdToken };
