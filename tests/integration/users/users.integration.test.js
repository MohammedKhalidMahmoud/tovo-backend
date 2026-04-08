const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../helpers/usersTestApp');
const prisma = require('../../../src/config/prisma');
const mailer = require('../../../src/config/mailer');

const createCustomerToken = (userId = 'user-1') =>
  jwt.sign({ id: userId, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createEmailChangeToken = ({
  userId = 'user-1',
  currentEmail = 'current@example.com',
  newEmail = 'new@example.com',
} = {}) =>
  jwt.sign(
    { type: 'email_change', userId, currentEmail, newEmail },
    process.env.EMAIL_CHANGE_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_CHANGE_TOKEN_EXPIRES_IN || '1h' }
  );

describe('Users Module Integration (mocked DB)', () => {
  describe('PUT /api/v1/users/me/email', () => {
    it('sends a verification link to the new email after checking the current password', async () => {
      const token = createCustomerToken();
      const passwordHash = await bcrypt.hash('CurrentPass123', 10);

      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer' })
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer', email: 'current@example.com', passwordHash })
        .mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/v1/users/me/email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          new_email: 'new@example.com',
          current_password: 'CurrentPass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Verification email sent to the new address');
      expect(res.body.data.pendingEmail).toBe('new@example.com');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailer.sendMail).toHaveBeenCalledTimes(1);
      expect(mailer.sendMail.mock.calls[0][0].to).toBe('new@example.com');
      expect(mailer.sendMail.mock.calls[0][0].html).toContain('/api/v1/users/email-change/verify?token=');
    });

    it('returns an error when the current password is wrong', async () => {
      const token = createCustomerToken();
      const passwordHash = await bcrypt.hash('CurrentPass123', 10);

      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer' })
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer', email: 'current@example.com', passwordHash });

      const res = await request(app)
        .put('/api/v1/users/me/email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          new_email: 'new@example.com',
          current_password: 'WrongPass123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Current password is incorrect');
      expect(mailer.sendMail).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/email-change/verify', () => {
    it('updates the email only after the verification link is used', async () => {
      const verificationToken = createEmailChangeToken();

      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer', email: 'current@example.com', passwordHash: 'hash' })
        .mockResolvedValueOnce(null);
      prisma.user.update.mockResolvedValueOnce({ id: 'user-1', email: 'new@example.com' });

      const res = await request(app)
        .get('/api/v1/users/email-change/verify')
        .query({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Email updated successfully');
      expect(res.body.data).toEqual({
        id: 'user-1',
        email: 'new@example.com',
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { email: 'new@example.com' },
      });
    });
  });

  describe('PUT /api/v1/users/me/password', () => {
    it('changes password successfully for an authenticated customer', async () => {
      const token = createCustomerToken();
      const passwordHash = await bcrypt.hash('CurrentPass123', 10);

      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer' })
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer', passwordHash });
      prisma.user.update.mockResolvedValueOnce({ id: 'user-1' });

      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'CurrentPass123',
          new_password: 'NewPassword123',
          confirm_password: 'NewPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password changed successfully');
      expect(res.body.data).toBeNull();
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update.mock.calls[0][0].where).toEqual({ id: 'user-1' });
      expect(prisma.user.update.mock.calls[0][0].data.passwordHash).toEqual(expect.any(String));
      expect(prisma.user.update.mock.calls[0][0].data.passwordHash).not.toBe(passwordHash);
      expect(await bcrypt.compare('NewPassword123', prisma.user.update.mock.calls[0][0].data.passwordHash)).toBe(true);
    });

    it('returns an error when the current password is wrong', async () => {
      const token = createCustomerToken();
      const passwordHash = await bcrypt.hash('CurrentPass123', 10);

      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer' })
        .mockResolvedValueOnce({ id: 'user-1', role: 'customer', passwordHash });

      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'WrongPass123',
          new_password: 'NewPassword123',
          confirm_password: 'NewPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Current password is incorrect');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('returns validation error when confirmation does not match', async () => {
      const token = createCustomerToken();

      prisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', role: 'customer' });

      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'CurrentPass123',
          new_password: 'NewPassword123',
          confirm_password: 'Mismatch123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
