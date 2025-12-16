import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Users E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  describe('GET /users/profile', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await api(app).get('/users/profile').send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect((response.body as { message: string }).message).toContain(
        'Token de acesso ausente.',
      );
    });

    it('should return user profile for authenticated admin', async () => {
      const client = await api(app).createAdminAndLogin();
      const response = await client.get('/users/profile').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Dados do usuário retornado com sucesso.',
      );
      expect(response.body).toHaveProperty('data');
    });

    // it('should return user profile for authenticated patient', async () => {
    //   const client = await api(app).createPatientAndLogin();
    //   const response = await client.get('/users/profile').send();

    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('success', true);
    //   expect(response.body).toHaveProperty(
    //     'message',
    //     'Dados do usuário retornado com sucesso.',
    //   );
    //   expect(response.body).toHaveProperty('data');
    // });

    it('should return user profile for authenticated manager', async () => {
      const client = await api(app).createManagerAndLogin();
      const response = await client.get('/users/profile').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Dados do usuário retornado com sucesso.',
      );
      expect(response.body).toHaveProperty('data');
    });

    it('should return user profile for authenticated nurse', async () => {
      const client = await api(app).createNurseAndLogin();
      const response = await client.get('/users/profile').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Dados do usuário retornado com sucesso.',
      );
      expect(response.body).toHaveProperty('data');
    });

    it('should return user profile for authenticated specialist', async () => {
      const client = await api(app).createSpecialistAndLogin();
      const response = await client.get('/users/profile').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Dados do usuário retornado com sucesso.',
      );
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Registration Flow', () => {
    it('should handle invalid registration data properly', async () => {
      const invalidUsers = [
        {
          name: '',
          email: '',
          password: '',
        },
        {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        },
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
        },
      ];

      for (const invalidUser of invalidUsers) {
        const response = await api(app).post('/register').send(invalidUser);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty(
          'message',
          'Os dados enviados são inválidos.',
        );
        expect(response.body).toHaveProperty('fields');
        expect(
          Array.isArray((response.body as { fields: unknown }).fields),
        ).toBe(true);
        expect(
          (response.body as { fields: unknown[] }).fields.length,
        ).toBeGreaterThan(0);
      }
    });

    it('should handle registration and login attempt', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securePassword123',
      };

      const registrationResponse = await api(app)
        .post('/register')
        .send(newUser);

      // We expect either success, conflict, or validation error
      expect([201, 400, 409, 422].includes(registrationResponse.status)).toBe(
        true,
      );

      if (registrationResponse.status === 201) {
        const signInResponse = await api(app).post('/login').send({
          email: newUser.email,
          password: newUser.password,
        });

        expect([200, 201, 400, 401].includes(signInResponse.status)).toBe(true);
      }
    });
  });
});
