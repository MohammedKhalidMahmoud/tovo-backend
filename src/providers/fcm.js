const getAdmin = require('../config/firebase');

const sendMulticast = async (tokens, { title, body, data = {} }) => {
  if (!tokens.length) return { successCount: 0, failureCount: 0, failedTokens: [] };

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  // getAdmin() is called here (not at require time) so the app starts
  // even when Firebase credentials are not yet configured.
  const response = await getAdmin().messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: stringData,
  });

  const failedTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success) failedTokens.push(tokens[i]);
  });

  return { successCount: response.successCount, failureCount: response.failureCount, failedTokens };
};

module.exports = { sendMulticast };
