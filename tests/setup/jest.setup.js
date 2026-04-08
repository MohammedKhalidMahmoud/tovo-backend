process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

jest.mock('../../src/config/prisma', () => require('./prisma.mock'));
jest.mock('../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'mocked-message-id' }),
}));
jest.mock('../../src/config/firebase', () => {
  const verifyIdToken = jest.fn();
  const getAdmin = jest.fn(() => ({
    auth: () => ({
      verifyIdToken,
    }),
  }));
  getAdmin.__mockVerifyIdToken = verifyIdToken;
  return getAdmin;
});

beforeEach(() => {
  jest.clearAllMocks();
});
