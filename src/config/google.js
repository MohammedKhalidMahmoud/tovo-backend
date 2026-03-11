const { OAuth2Client } = require('google-auth-library');

let client;

const getClient = () => {
  if (!client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID must be set in environment variables');
    client = new OAuth2Client(clientId);
  }
  return client;
};

const verifyIdToken = (idToken) =>
  getClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

module.exports = { verifyIdToken };
