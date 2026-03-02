const admin = require('firebase-admin');

/**
 * Lazily initialises the Firebase Admin SDK on first use.
 * This prevents the app from crashing at startup when Firebase
 * credentials are not yet configured.
 *
 * Call getAdmin() inside fcm functions, not at module load time.
 */
const getAdmin = () => {
  if (admin.apps.length) return admin;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  return admin;
};

module.exports = getAdmin;
