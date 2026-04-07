const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../helpers/testApp');
const prisma = require('../../../src/config/prisma');
const mailer = require('../../../src/config/mailer');

describe('Auth Module Integration (mocked DB)', () => {
  describe('POST /api/v1/auth/register/user', () => {
    it('registers a customer successfully', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '01000000000',
        role: 'customer',
        passwordHash: 'hashed-password',
      });
      prisma.wallet.create.mockResolvedValueOnce({ id: 'wallet-1' });

      const res = await request(app)
        .post('/api/v1/auth/register/user')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '01000000000',
          password: 'Password123',
          confirm_password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toMatchObject({
        id: 'user-1',
        email: 'john@example.com',
        role: 'customer',
      });
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', currency: 'EGP' },
      });
    });

    it('returns validation error when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/user')
        .send({
          email: 'john@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('returns conflict when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'john@example.com',
      });

      const res = await request(app)
        .post('/api/v1/auth/register/user')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '01000000000',
          password: 'Password123',
          confirm_password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in customer successfully', async () => {
      const passwordHash = await bcrypt.hash('Password123', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '01000000000',
        role: 'customer',
        passwordHash,
      });
      prisma.refreshToken.create.mockResolvedValueOnce({ id: 'rt-1' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'john@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('returns invalid credentials for wrong password', async () => {
      const passwordHash = await bcrypt.hash('Password123', 10);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        role: 'customer',
        passwordHash,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'john@example.com',
          password: 'WrongPass123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'john@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/otp/send', () => {
    it('creates OTP successfully', async () => {
      prisma.otp.create.mockResolvedValueOnce({ id: 'otp-1' });

      const res = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phone: '01000000000' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OTP sent');
      expect(res.body.data.message).toBe('OTP generated successfully. Delivery is handled out-of-band.');
      expect(prisma.otp.create).toHaveBeenCalledTimes(1);
    });

    it('returns validation error when phone is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/otp/verify', () => {
    it('verifies OTP successfully', async () => {
      prisma.otp.findFirst.mockResolvedValueOnce({
        id: 'otp-1',
        phone: '01000000000',
        code: '123456',
      });
      prisma.otp.update.mockResolvedValueOnce({ id: 'otp-1', isUsed: true });
      prisma.user.updateMany.mockResolvedValueOnce({ count: 1 });

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '01000000000', otp_code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OTP verified');
      expect(res.body.data.verified).toBe(true);
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { phone: '01000000000' },
        data: { isVerified: true },
      });
    });

    it('returns error for invalid or expired OTP', async () => {
      prisma.otp.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '01000000000', otp_code: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or expired OTP');
    });

    it('returns validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: '01000000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/token/refresh', () => {
    it('refreshes access token successfully', async () => {
      const refreshToken = jwt.sign(
        { id: 'user-1', role: 'customer' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1h' }
      );

      prisma.refreshToken.findFirst.mockResolvedValueOnce({
        id: 'rt-1',
        token: refreshToken,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        role: 'customer',
      });

      const res = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Token refreshed');
      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });

    it('returns unauthorized for invalid refresh token', async () => {
      prisma.refreshToken.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Refresh token is invalid or expired');
    });

    it('returns validation error when refreshToken is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/token/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('Password reset flow', () => {
    describe('POST /api/v1/auth/forgot-password', () => {
      it('sends reset OTP for existing user', async () => {
        prisma.user.findUnique.mockResolvedValueOnce({
          id: 'user-1',
          email: 'john@example.com',
        });
        prisma.passwordResetToken.create.mockResolvedValueOnce({ id: 'prt-1' });

        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'john@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toBe('If this email is registered, an OTP has been sent.');
        expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
        expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      });

      it('returns validation error for missing email', async () => {
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation failed');
      });
    });

    describe('POST /api/v1/auth/reset-password', () => {
      it('resets password successfully with valid OTP', async () => {
        prisma.passwordResetToken.findFirst.mockResolvedValueOnce({
          id: 'prt-1',
          email: 'john@example.com',
          code: '123456',
        });
        prisma.passwordResetToken.update.mockResolvedValueOnce({ id: 'prt-1', isUsed: true });
        prisma.user.update.mockResolvedValueOnce({ id: 'user-1' });

        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            email: 'john@example.com',
            otp: '123456',
            new_password: 'NewPassword123',
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Password reset successful');
        expect(res.body.data.message).toBe('Password updated successfully');
      });

      it('returns error for expired OTP', async () => {
        prisma.passwordResetToken.findFirst.mockResolvedValueOnce(null);

        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            email: 'john@example.com',
            otp: '123456',
            new_password: 'NewPassword123',
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid or expired OTP');
      });

      it('returns validation error for missing fields', async () => {
        const res = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ email: 'john@example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation failed');
      });
    });
  });

  describe('Unauthorized access', () => {
    it('returns unauthorized when calling logout without token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No token provided');
    });
  });
});
