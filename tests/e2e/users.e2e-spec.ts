import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { User } from '@/domain/entities/user';

import {
  createAdminAndLogin,
  createMemberAndLogin,
} from '../config/auth-helper';
import { userFactory } from '../config/factories/user.factory';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

const DEFAULT_PASSWORD = 'TestPassword123!';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('GET /users', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .query({ page: 1, perPage: 10 })
        .expect(401);
    });

    it('returns 200 + paginated users as admin', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user1 = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'specialist',
          email: 'spec1@example.com',
        }),
      );
      const user2 = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'member',
          email: 'mem1@example.com',
        }),
      );
      await repo.save([user1, user2]);

      const { cookies } = await createAdminAndLogin();

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('returns 200 + paginated users as member', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const user1 = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'specialist',
          email: 'spec2@example.com',
        }),
      );
      await repo.save(user1);

      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /users/:id', () => {
    it('returns 200 for existing user', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const target = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'specialist',
          email: 'target@example.com',
          name: 'Target User',
        }),
      );
      await repo.save(target);

      const { cookies } = await createAdminAndLogin();

      const res = await request(app.getHttpServer())
        .get(`/users/${target.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(target.id);
      expect(res.body.data.name).toBe(target.name);
    });

    it('returns 404 for non-existent user', async () => {
      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('returns 200 on successful update (admin)', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const target = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'specialist',
          email: 'update-user@example.com',
          name: 'Old Name',
        }),
      );
      await repo.save(target);

      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .put(`/users/${target.id}`)
        .set('Cookie', cookies)
        .send({
          name: 'Updated Name',
          specialty: 'neurology',
          registrationId: 'CRM12345',
        })
        .expect(200);
    });
  });

  describe('PATCH /users/:id/deactivate', () => {
    it('returns 200 as admin', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const target = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'member',
          email: 'deact-user@example.com',
          status: 'active',
        }),
      );
      await repo.save(target);

      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .patch(`/users/${target.id}/deactivate`)
        .set('Cookie', cookies)
        .expect(200);

      const updated = await repo.findOne({ where: { id: target.id } });
      expect(updated!.status).toBe('inactive');
    });
  });

  describe('PATCH /users/:id/activate', () => {
    it('returns 200 as admin', async () => {
      const ds = getTestDataSource();
      const cryptoService = app.get(CryptographyService);
      const hashedPassword = await cryptoService.createHash(DEFAULT_PASSWORD);

      const repo = ds.getRepository(User);
      const target = repo.create(
        userFactory({
          password: hashedPassword,
          role: 'member',
          email: 'act-user@example.com',
          status: 'inactive',
        }),
      );
      await repo.save(target);

      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .patch(`/users/${target.id}/activate`)
        .set('Cookie', cookies)
        .expect(200);

      const updated = await repo.findOne({ where: { id: target.id } });
      expect(updated!.status).toBe('active');
    });
  });
});
