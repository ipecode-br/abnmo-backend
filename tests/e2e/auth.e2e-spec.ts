import { INestApplication } from '@nestjs/common';

import type {
  CreateUserBody,
  SignInWithEmailResponse,
} from '@/app/http/auth/auth.dtos';
import { getTokenMaxAge } from '@/config/tokens';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import {
  createAdmin,
  createMember,
  TEST_DEFAULT_PASSWORD,
} from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { restoreFakeTime, setFakeTime } from '../helpers/fake-time';
import { createInviteToken, createPasswordResetToken } from '../helpers/tokens';
import { createUser, getUserByEmail } from '../helpers/users';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('POST /login', () => {
    it('allows login with valid credentials', async () => {
      const { member } = await createMember();

      const res = await api.post<SignInWithEmailResponse>('/login', {
        email: member.email,
        password: TEST_DEFAULT_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(member.role);
    });

    it('rejects unknown email', async () => {
      const res = await api.post('/login', {
        email: 'unknown@example.com',
        password: TEST_DEFAULT_PASSWORD,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    });

    it('rejects wrong password', async () => {
      const { member } = await createMember();

      const res = await api.post('/login', {
        email: member.email,
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    });

    it('blocks inactive users', async () => {
      const user = await createUser({ status: 'inactive' });

      const res = await api.post('/login', {
        email: user.email,
        password: TEST_DEFAULT_PASSWORD,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Permissão de acesso negada. Sua conta está inativa.',
      );
    });

    it('rejects missing fields', async () => {
      const res = await api.post('/login', {});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });
  });

  describe('POST /register/user', () => {
    it('registers user with valid invite token', async () => {
      const email = 'register@example.com';
      const invite = await createInviteToken({ email, role: 'member' });

      const res = await api.post<BaseResponseBody, CreateUserBody>(
        '/register/user',
        {
          inviteToken: invite.token,
          name: 'Test User',
          password: TEST_DEFAULT_PASSWORD,
          role: 'member',
        },
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sua conta foi cadastrada com sucesso.');

      const user = await getUserByEmail(email);

      expect(user!.email).toBe(email);
      expect(user!.role).toBe('member');
    });

    it('rejects invalid invite token', async () => {
      const res = await api.post<BaseResponseBody, CreateUserBody>(
        '/register/user',
        {
          inviteToken: 'invalid-token',
          name: 'Test User',
          password: TEST_DEFAULT_PASSWORD,
          role: 'member',
        },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Token de convite não encontrado.');
    });

    it('rejects expired invite token', async () => {
      const expiryTime = getTokenMaxAge('invite_user');
      setFakeTime(new Date(Date.now() - expiryTime));

      const invite = await createInviteToken({
        email: 'expired-token@example.com',
        role: 'member',
      });

      restoreFakeTime();

      const res = await api.post('/register/user', {
        inviteToken: invite.token,
        name: 'Test User',
        password: TEST_DEFAULT_PASSWORD,
        role: 'member',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Token de convite inválido ou expirado.');
    });

    it('rejects already registered email', async () => {
      const user = await createUser();

      const role = 'member';
      const invite = await createInviteToken({ role, email: user.email });

      const res = await api.post('/register/user', {
        inviteToken: invite.token,
        name: 'Test User',
        password: TEST_DEFAULT_PASSWORD,
        role,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Este e-mail já está cadastrado no sistema.',
      );
    });
  });

  describe('POST /change-password', () => {
    it('allows password change', async () => {
      const { member, cookies } = await createMember({ login: true });

      const newPassword = 'NewPassword123!';
      const res = await api.post(
        '/change-password',
        { password: TEST_DEFAULT_PASSWORD, newPassword },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Senha alterada com sucesso.');

      const loginRes = await api.post('/login', {
        email: member.email,
        password: newPassword,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('rejects wrong current password', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post(
        '/change-password',
        {
          password: 'WrongCurrentPassword123!',
          newPassword: 'NewPassword123!',
        },
        { cookies },
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Senha atual inválida.');
    });

    it('rejects same password', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post(
        '/change-password',
        { password: TEST_DEFAULT_PASSWORD, newPassword: TEST_DEFAULT_PASSWORD },
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'A nova senha deve ser diferente da senha atual.',
      );
    });
  });

  describe('POST /recover-password', () => {
    it('accepts existing email', async () => {
      const user = await createUser({ email: 'recover@example.com' });

      const res = await api.post('/recover-password', {
        email: user.email,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'O link para redefinição de senha foi enviado ao e-mail informado.',
      );
    });

    it('silently accepts non-existing email', async () => {
      const res = await api.post('/recover-password', {
        email: 'ghost@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'O link para redefinição de senha foi enviado ao e-mail informado.',
      );
    });
  });

  describe('POST /reset-password', () => {
    it('resets password with valid token', async () => {
      const user = await createUser();
      const reset = await createPasswordResetToken({ userId: user.id });

      const password = 'NewStr0ng!Pass';
      const res = await api.post('/reset-password', {
        password,
        resetToken: reset.token,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Senha atualizada com sucesso.');

      const loginRes = await api.post('/login', {
        email: user.email,
        password,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('rejects invalid token', async () => {
      const res = await api.post('/reset-password', {
        password: TEST_DEFAULT_PASSWORD,
        resetToken: 'invalid-token-12345',
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Token de redefinição de senha não encontrado.',
      );
    });

    it('rejects expired token', async () => {
      const expiryTime = getTokenMaxAge('password_reset');

      setFakeTime(new Date(Date.now() - expiryTime));

      const user = await createUser();
      const reset = await createPasswordResetToken({ userId: user.id });

      restoreFakeTime();

      const res = await api.post('/reset-password', {
        password: TEST_DEFAULT_PASSWORD,
        resetToken: reset.token,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Token de redefinição de senha inválido ou expirado.',
      );
    });
  });

  describe('POST /logout', () => {
    it('clears session and prevents further requests', async () => {
      const { cookies } = await createAdmin({ login: true });

      const logoutRes = await api.post('/logout', undefined, {
        cookies,
      });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const usersRes = await api.get('/users', { page: 1, perPage: 10 });

      expect(usersRes.status).toBe(401);
      expect(usersRes.body.success).toBe(false);
    });
  });
});
