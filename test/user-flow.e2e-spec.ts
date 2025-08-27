/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { User } from '@/domain/entities/user';

import { getTestApp, getTestDataSource } from './setup';

describe('User Complete Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(() => {
    app = getTestApp();
    dataSource = getTestDataSource();
  });

  describe('Complete User Registration and Authentication Flow', () => {
    it('should complete full user journey: register -> login -> access protected route', async () => {
      // Step 1: Create a new user account
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securePassword123',
      };

      const registrationResponse = await request(app.getHttpServer())
        .post('/register')
        .send(newUser)
        .expect(201);

      expect(registrationResponse.body).toMatchObject({
        success: true,
        message: 'Conta registrada com sucesso.',
      });

      // Step 2: Verify user exists in database
      const userRepository = dataSource.getRepository(User);
      const createdUser = await userRepository.findOne({
        where: { email: newUser.email },
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser?.name).toBe(newUser.name);

      // Step 3: Sign in with the created user
      const signInResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        })
        .expect(201);

      expect(signInResponse.body).toMatchObject({
        success: true,
        message: 'Login realizado com sucesso.',
      });

      // Step 4: Extract authentication cookie
      const cookies = signInResponse.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(cookies).toBeTruthy();

      const authCookie = cookies?.find((cookie: string) =>
        cookie.startsWith('access_token='),
      );
      expect(authCookie).toBeTruthy();

      // Step 5: Access a protected route using the authentication cookie
      // (Assuming there's a protected route like GET /users/profile)
      const protectedResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Cookie', authCookie as string)
        .expect(200);

      expect(protectedResponse.body).toMatchObject({
        success: true,
        message: 'Dados do usuário retornado com sucesso.',
      });
      expect(protectedResponse.body.data).toMatchObject({
        email: newUser.email,
        name: newUser.name,
      });
    });

    it('should handle invalid registration data properly', async () => {
      const invalidUsers = [
        {
          // Missing required fields
          name: '',
          email: '',
          password: '',
        },
        {
          // Invalid email format
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        },
        {
          // Password too short
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
        },
      ];

      for (const invalidUser of invalidUsers) {
        const response = await request(app.getHttpServer())
          .post('/register')
          .send(invalidUser)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty(
          'message',
          'Os dados enviados são inválidos.',
        );
        expect(response.body).toHaveProperty('fields');
        expect(Array.isArray(response.body.fields)).toBe(true);
        expect(response.body.fields.length).toBeGreaterThan(0);
      }
    });

    it('should prevent access to protected routes without authentication', async () => {
      // Try to access protected route without authentication
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');

      expect(response.body.message).toContain('Token de acesso ausente.');
    });

    it('should handle concurrent user registrations properly', async () => {
      const users = [
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password123',
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password123',
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          password: 'password123',
        },
      ];

      // Register all users concurrently
      const registrationPromises = users.map((user) =>
        request(app.getHttpServer()).post('/register').send(user).expect(201),
      );

      const responses = await Promise.all(registrationPromises);

      // Verify all registrations were successful
      responses.forEach((response) => {
        expect(response.body).toMatchObject({
          success: true,
          message: 'Conta registrada com sucesso.',
        });
      });

      // Verify all users exist in database
      const userRepository = dataSource.getRepository(User);
      const userCount = await userRepository.count();
      expect(userCount).toBe(users.length);

      // Verify each user can sign in
      const signInPromises = users.map((user) =>
        request(app.getHttpServer())
          .post('/login')
          .send({
            email: user.email,
            password: user.password,
          })
          .expect(201),
      );

      const signInResponses = await Promise.all(signInPromises);

      signInResponses.forEach((response) => {
        expect(response.body).toMatchObject({
          success: true,
          message: 'Login realizado com sucesso.',
        });
      });
    });
  });
});
