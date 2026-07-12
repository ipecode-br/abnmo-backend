import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

import { createMemberAndLogin } from '../config/auth-helper';
import { userFactory } from '../config/factories/user.factory';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

const DEFAULT_PASSWORD = 'TestPassword123!';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /login', () => {
    it('returns 200 + role in data + set-cookie for valid credentials', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user = repo.create(
        userFactory({
          password: hashedPassword,
          email: 'login-test@example.com',
          role: 'member',
        }),
      );
      await repo.save(user);

      const res = await request(app.getHttpServer())
        .post('/login')
        .send({ email: user.email, password: DEFAULT_PASSWORD })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.role).toBe(user.role);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'].length).toBeGreaterThan(0);
    });

    it('returns 401 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/login')
        .send({ email: 'nonexistent@example.com', password: DEFAULT_PASSWORD })
        .expect(401);
    });

    it('returns 401 for wrong password', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user = repo.create(
        userFactory({
          password: hashedPassword,
          email: 'wrong-pass-test@example.com',
          role: 'member',
        }),
      );
      await repo.save(user);

      await request(app.getHttpServer())
        .post('/login')
        .send({ email: user.email, password: 'WrongPassword123!' })
        .expect(401);
    });

    it('returns 403 for inactive user', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user = repo.create(
        userFactory({
          password: hashedPassword,
          email: 'inactive-test@example.com',
          role: 'member',
          status: 'inactive',
        }),
      );
      await repo.save(user);

      await request(app.getHttpServer())
        .post('/login')
        .send({ email: user.email, password: DEFAULT_PASSWORD })
        .expect(403);
    });
  });

  describe('POST /register/user', () => {
    it('returns 201 with valid invite token', async () => {
      const ds = getTestDataSource();
      const jwtService = app.get(JwtService);

      const inviteToken = await jwtService.signAsync(
        { role: 'member' },
        { expiresIn: '8h' },
      );
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

      const tokensRepo = ds.getRepository(Token);
      const tokenEntity = tokensRepo.create({
        token: inviteToken,
        type: 'invite_user',
        email: 'register-test@example.com',
        expiresAt,
      });
      await tokensRepo.save(tokenEntity);

      const res = await request(app.getHttpServer())
        .post('/register/user')
        .send({
          name: 'Test User',
          password: DEFAULT_PASSWORD,
          inviteToken,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();

      const usersRepo = ds.getRepository(User);
      const created = await usersRepo.findOne({
        where: { email: 'register-test@example.com' },
      });
      expect(created).not.toBeNull();
      expect(created!.role).toBe('member');
    });
  });

  describe('POST /change-password', () => {
    it('returns 200 as authenticated user', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .post('/change-password')
        .set('Cookie', cookies)
        .send({
          password: DEFAULT_PASSWORD,
          newPassword: 'NewPassword123!',
        })
        .expect(200);
    });

    it('returns 401 with wrong current password', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .post('/change-password')
        .set('Cookie', cookies)
        .send({
          password: 'WrongCurrentPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /recover-password', () => {
    it('returns 200 for existing email', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user = repo.create(
        userFactory({
          password: hashedPassword,
          email: 'recover-test@example.com',
          role: 'member',
        }),
      );
      await repo.save(user);

      await request(app.getHttpServer())
        .post('/recover-password')
        .send({ email: user.email })
        .expect(200);
    });
  });

  describe('POST /logout', () => {
    it('clears session and subsequent request without cookie returns 401', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .post('/logout')
        .set('Cookie', cookies)
        .expect(200);

      await request(app.getHttpServer())
        .get('/users')
        .query({ page: 1, perPage: 10 })
        .expect(401);
    });
  });

  describe('POST /reset-password', () => {
    it('returns 404 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/reset-password')
        .send({
          password: DEFAULT_PASSWORD,
          resetToken: 'invalid-token-12345',
        })
        .expect(404);
    });
  });
});
