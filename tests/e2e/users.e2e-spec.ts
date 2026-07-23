import { INestApplication } from '@nestjs/common';

import type {
  CreateUserInviteBody,
  GetUserInvitesResponse,
  GetUserResponse,
  GetUsersResponse,
  UpdateUserBody,
  UpdateUserFeaturesBody,
} from '@/app/http/users/users.dtos';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import { createAdmin, createMember } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { createUserInvite, getUserInvites } from '../helpers/invites';
import { createUser, getUserById } from '../helpers/users';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('GET /users', () => {
    it('paginates users properly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:user:others'],
      });

      const totalUsers = 15;
      for (let i = 0; i < totalUsers; i++) {
        await createUser({ role: 'specialist' });
      }

      const firstPage = await api.get<GetUsersResponse>(
        '/users',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.users).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalUsers + 1);

      const secondPage = await api.get<GetUsersResponse>(
        '/users',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.users).toHaveLength(6);
      expect(secondPage.body.data.total).toBe(totalUsers + 1);
    });

    it('blocks user without "read:user:others" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/users',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('GET /users/me', () => {
    it('returns own profile', async () => {
      const { member, cookies } = await createMember({
        login: true,
        features: ['read:user'],
      });

      const res = await api.get<GetUserResponse>('/users/me', undefined, {
        cookies,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Dados do usuário retornados com sucesso.');
      expect(res.body.data.id).toBe(member.id);
      expect(res.body.data.email).toBe(member.email);
    });

    it('cannot get own profile without "read:user" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.get('/users/me', undefined, { cookies });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('GET /users/:id', () => {
    it('returns user by ID', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:user:others'],
      });
      const target = await createUser({ name: 'Target User' });

      const res = await api.get<GetUserResponse>(
        `/users/${target.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(target.id);
      expect(res.body.data.name).toBe(target.name);
      expect(res.body.data.email).toBe(target.email);
      expect(res.body.data.role).toBe(target.role);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get<GetUserResponse>(
        '/users/00000000-0000-0000-0000-000000000000',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Usuário não encontrado.');
    });

    it('blocks user without "read:user" or "read:user:others" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const target = await createUser({ role: 'specialist' });

      const res = await api.get<GetUserResponse>(
        `/users/${target.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PUT /users/:id', () => {
    const updateBody: UpdateUserBody = {
      name: 'Updated Name',
      specialty: 'neurology',
      registrationId: 'CRM-UPDATED',
    };

    it('updates own data', async () => {
      const { member, cookies } = await createMember({
        login: true,
        features: ['update:user'],
      });

      const res = await api.put<BaseResponseBody, UpdateUserBody>(
        `/users/${member.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Usuário atualizado com sucesso.');

      const updatedUser = await getUserById(member.id);

      expect(updatedUser?.name).toBe(updateBody.name);
      expect(updatedUser?.specialty).toBe(updateBody.specialty);
      expect(updatedUser?.registrationId).toBe(updateBody.registrationId);
    });

    it('can update another user with "update:user:others" feature', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:user:others'],
      });

      const target = await createUser({ name: 'Old Name' });

      const res = await api.put<BaseResponseBody, UpdateUserBody>(
        `/users/${target.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Usuário atualizado com sucesso.');

      const updatedUser = await getUserById(target.id);

      expect(updatedUser?.name).toBe(updateBody.name);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.put<BaseResponseBody, UpdateUserBody>(
        '/users/00000000-0000-0000-0000-000000000000',
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Usuário não encontrado.');
    });

    it('blocks user without "update:user" or "update:user:others" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.put<BaseResponseBody, UpdateUserBody>(
        '/users/sample-id',
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot update another user without "update:user:others" feature', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:user'],
      });
      const target = await createUser();

      const res = await api.put<BaseResponseBody, UpdateUserBody>(
        `/users/${target.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PATCH /users/:id/features', () => {
    it('admin updates user features', async () => {
      const { cookies } = await createAdmin({ login: true });
      const target = await createUser({ features: [] });

      const res = await api.patch<BaseResponseBody, UpdateUserFeaturesBody>(
        `/users/${target.id}/features`,
        { features: ['read:patient', 'deactivate:patient'] },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Permissões atualizadas com sucesso.');

      const updatedUser = await getUserById(target.id);

      expect(updatedUser?.features).toContain('read:patient');
      expect(updatedUser?.features).toContain('deactivate:patient');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch<BaseResponseBody, UpdateUserFeaturesBody>(
        '/users/00000000-0000-0000-0000-000000000000/features',
        { features: [] },
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Usuário não encontrado.');
    });

    it('blocks non-admin user', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.patch<BaseResponseBody, UpdateUserFeaturesBody>(
        `/users/sample-id/features`,
        { features: [] },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PATCH /users/:id/deactivate', () => {
    it('deactivates a user', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['deactivate:user'],
      });
      const target = await createUser({ status: 'active' });

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Usuário inativado com sucesso.');

      const updatedUser = await getUserById(target.id);

      expect(updatedUser?.status).toBe('inactive');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch<BaseResponseBody>(
        '/users/00000000-0000-0000-0000-000000000000/deactivate',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Usuário não encontrado.');
    });

    it('blocks user without "deactivate:user" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const target = await createUser();

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot deactivate an inactive user', async () => {
      const { cookies } = await createAdmin({ login: true });
      const target = await createUser({ status: 'inactive' });

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Este usuário já está inativo.');
    });
  });

  describe('PATCH /users/:id/activate', () => {
    it('activates a user', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['activate:user'],
      });
      const target = await createUser({ status: 'inactive' });

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/activate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Usuário ativado com sucesso.');

      const updatedUser = await getUserById(target.id);

      expect(updatedUser?.status).toBe('active');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch<BaseResponseBody>(
        '/users/00000000-0000-0000-0000-000000000000/activate',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Usuário não encontrado.');
    });

    it('blocks user without "activate:user" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const target = await createUser({ role: 'member' });

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/activate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot activate an active user', async () => {
      const { cookies } = await createAdmin({ login: true });
      const target = await createUser({ status: 'active' });

      const res = await api.patch<BaseResponseBody>(
        `/users/${target.id}/activate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Este usuário já está ativo.');
    });
  });

  describe('POST /users/invites', () => {
    const inviteBody: CreateUserInviteBody = {
      email: 'invite@example.com',
      role: 'member',
    };

    it('creates an invite', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['create:user-invite'],
      });

      const res = await api.post<BaseResponseBody, CreateUserInviteBody>(
        '/users/invites',
        inviteBody,
        { cookies },
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Convite do usuário enviado com sucesso.');

      const invites = await getUserInvites({ email: inviteBody.email });

      expect(invites.length).toBe(1);
      expect(invites[0].email).toBe(inviteBody.email);
    });

    it('blocks user without "create:user-invite" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post<BaseResponseBody, CreateUserInviteBody>(
        '/users/invites',
        inviteBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot create invite for existing user email', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['create:user-invite'],
      });
      const existingUser = await createUser({ email: 'existing@example.com' });

      const res = await api.post<BaseResponseBody, CreateUserInviteBody>(
        '/users/invites',
        { email: existingUser.email, role: 'member' },
        { cookies },
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Este e-mail já está cadastrado no sistema.',
      );
    });
  });

  describe('GET /users/invites', () => {
    it('paginates invites properly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:user-invite'],
      });

      const totalInvites = 15;
      for (let i = 0; i < totalInvites; i++) {
        await createUserInvite({ email: `invite-${i}@example.com` });
      }

      const firstPage = await api.get<GetUserInvitesResponse>(
        '/users/invites',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.invites).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalInvites);

      const secondPage = await api.get<GetUserInvitesResponse>(
        '/users/invites',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.invites).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalInvites);
    });

    it('blocks user without "read:user-invite" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/users/invites',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('DELETE /users/invites/:id', () => {
    it('deletes an invite', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['delete:user-invite'],
      });
      const email = 'test@example.com';

      const invite = await createUserInvite({ email });
      const savedInvites = await getUserInvites({ email });

      expect(savedInvites.length).toBe(1);

      const res = await api.delete<BaseResponseBody>(
        `/users/invites/${invite.id}`,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Convite cancelado com sucesso.');

      const invites = await getUserInvites({ email });

      expect(invites.length).toBe(0);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['delete:user-invite'],
      });

      const res = await api.delete<BaseResponseBody>(
        '/users/invites/00000000-0000-0000-0000-000000000000',
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Convite não encontrado.');
    });

    it('blocks user without "delete:user-invite" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.delete<BaseResponseBody>(
        '/users/invites/sample-id',
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });
});
