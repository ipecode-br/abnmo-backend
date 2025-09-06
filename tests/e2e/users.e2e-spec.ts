/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User } from '@/domain/entities/user';

import { api } from '../config/api-client';
import {
  clearTestDatabase,
  getTestApp,
  getTestDataSource,
} from '../config/setup';

describe('User Complete Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = getTestApp();
    dataSource = getTestDataSource();

    // Clear database to ensure clean state for user flow tests
    await clearTestDatabase();
  });

  describe('Complete User Registration and Authentication Flow', () => {
    it('should complete full user journey: register -> login -> access protected route', async () => {
      // Step 1: Create a new user account
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securePassword123',
      };

      const registrationResponse = await api(app)
        .post('/register')
        .expect(201)
        .send(newUser);

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
      const signInResponse = await api(app).post('/login').expect(201).send({
        email: newUser.email,
        password: newUser.password,
      });

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
      const protectedResponse = await api(app)
        .get('/users/profile')
        .headers({ Cookie: authCookie as string })
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
        const response = await api(app)
          .post('/register')
          .expect(400)
          .send(invalidUser);

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
      const response = await api(app).get('/users/profile').expect(401);

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
        api(app).post('/register').expect(201).send(user),
      );

      const responses = await Promise.all(registrationPromises);

      // Verify all registrations were successful
      responses.forEach((response) => {
        expect(response.body).toMatchObject({
          success: true,
          message: 'Conta registrada com sucesso.',
        });
      });

      // Verify all users exist in database by checking for specific emails
      const userRepository = dataSource.getRepository(User);

      for (const user of users) {
        const foundUser = await userRepository.findOne({
          where: { email: user.email },
        });
        expect(foundUser).toBeTruthy();
        expect(foundUser?.name).toBe(user.name);
      }

      // Verify each user can sign in
      const signInPromises = users.map((user) =>
        api(app).post('/login').expect(201).send({
          email: user.email,
          password: user.password,
        }),
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

  describe('API Client Usage Examples', () => {
    it('should demonstrate various API client patterns', async () => {
      const userData = {
        name: 'API Client User',
        email: 'apiclient@example.com',
        password: 'password123',
      };

      // Basic POST request
      const response = await api(app).post('/register').send(userData);
      expect([200, 201, 400, 409].includes(response.status)).toBe(true);

      // Request with status expectation
      const loginResponse = await api(app).post('/login').send({
        email: userData.email,
        password: userData.password,
      });
      expect([200, 201, 400, 401].includes(loginResponse.status)).toBe(true);

      // GET request (no body needed)
      const healthResponse = await api(app).get('/health').send();
      expect([200, 404].includes(healthResponse.status)).toBe(true);

      // The API client provides clean, readable request patterns
    });
  });
});
