import { createHmac } from 'node:crypto';

import { INestApplication } from '@nestjs/common';

import {
  GetWebhookEventResponse,
  GetWebhookEventsResponse,
} from '@/app/http/webhooks/webhooks.dtos';
import { EnvService } from '@/env/env.service';

import type { BaseResponseBody } from '../config/api-client';
import { ApiClient, createApiClient } from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { createSurvey, getSurveyById } from '../helpers/surveys';
import { createWebhookEvent } from '../helpers/webhooks';

const DOCUMENT_KEY = '588ab577-7446-4ac6-9741-166591de12dc';

const makePayload = (overrides?: Record<string, unknown>) => ({
  event: { name: 'auto_close' },
  document: {
    key: DOCUMENT_KEY,
    status: 'closed',
    metadata: { key: 'catalogacao-abnmo' },
  },
  ...overrides,
});

const makeHmacHeader = (secret: string, body: object) => {
  const raw = JSON.stringify(body);
  return `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
};

describe('Webhooks – Signature (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;
  let secret: string;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
    secret = app.get(EnvService).get('CLICKSIGN_WEBHOOK_SECRET');
  });

  describe('POST /webhooks/signatures/survey', () => {
    it('returns 200 when content-hmac header is missing', async () => {
      const res = await api.post('/webhooks/signatures/survey', makePayload());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );
    });

    it('returns 200 when HMAC is invalid', async () => {
      const res = await api.post('/webhooks/signatures/survey', makePayload(), {
        headers: {
          'content-hmac':
            'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );
    });

    it('bypasses when metadata key does not match', async () => {
      const payload = makePayload({
        document: {
          key: DOCUMENT_KEY,
          status: 'closed',
          metadata: { key: 'wrong-key' },
        },
      });

      const res = await api.post('/webhooks/signatures/survey', payload, {
        headers: { 'content-hmac': makeHmacHeader(secret, payload) },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );
    });

    it('bypasses when event is not a completion event', async () => {
      const payload = makePayload({
        event: { name: 'sign' },
      });

      const res = await api.post('/webhooks/signatures/survey', payload, {
        headers: { 'content-hmac': makeHmacHeader(secret, payload) },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );
    });

    it('completes survey when metadata matches and event is completion', async () => {
      const { patient } = await createPatient();
      const survey = await createSurvey({
        status: 'pending_signature',
        signatureDocumentId: DOCUMENT_KEY,
        patient,
      });

      const payload = makePayload();

      const res = await api.post<BaseResponseBody>(
        '/webhooks/signatures/survey',
        payload,
        { headers: { 'content-hmac': makeHmacHeader(secret, payload) } },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );

      const updated = await getSurveyById(survey.id);

      expect(updated?.status).toBe('completed');
    });

    it('returns 200 when survey is not found', async () => {
      const payload = makePayload({
        document: {
          key: 'nonexistent-key',
          status: 'closed',
          metadata: { key: 'catalogacao-abnmo' },
        },
      });

      const res = await api.post('/webhooks/signatures/survey', payload, {
        headers: { 'content-hmac': makeHmacHeader(secret, payload) },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Webhook de assinatura recebido com sucesso.',
      );
    });
  });

  describe('GET /webhooks/events', () => {
    it('paginates events properly', async () => {
      const { cookies } = await createMember({
        features: ['read:webhook'],
        login: true,
      });

      const totalEvents = 15;
      for (let i = 0; i < totalEvents; i++) {
        await createWebhookEvent();
      }

      const firstPage = await api.get<GetWebhookEventsResponse>(
        '/webhooks/events',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.success).toBe(true);
      expect(firstPage.body.message).toBe(
        'Lista de eventos de webhook retornada com sucesso.',
      );
      expect(firstPage.body.data.events).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalEvents);

      const secondPage = await api.get<GetWebhookEventsResponse>(
        '/webhooks/events',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.events).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalEvents);
    });

    it('filters by status', async () => {
      const { cookies } = await createAdmin({ login: true });

      await createWebhookEvent({ status: 'received' });
      await createWebhookEvent({ status: 'success' });
      await createWebhookEvent({ status: 'success' });

      const res = await api.get<GetWebhookEventsResponse>(
        '/webhooks/events',
        { status: 'success', page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.events).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.events[0].status).toBe('success');
    });

    it('filters by event type', async () => {
      const { cookies } = await createAdmin({ login: true });

      await createWebhookEvent({ event: 'sign_survey' });

      const res = await api.get<GetWebhookEventsResponse>(
        '/webhooks/events',
        { event: 'sign_survey', page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('blocks user without "read:webhook" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/webhooks/events',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns event list items without payload', async () => {
      const { cookies } = await createMember({
        features: ['read:webhook'],
        login: true,
      });
      await createWebhookEvent();

      const res = await api.get<GetWebhookEventsResponse>(
        '/webhooks/events',
        { page: 1, perPage: 1 },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.events[0]).toHaveProperty('id');
      expect(res.body.data.events[0]).toHaveProperty('event');
      expect(res.body.data.events[0]).toHaveProperty('status');
      expect(res.body.data.events[0]).toHaveProperty('createdAt');
      expect(res.body.data.events[0]).not.toHaveProperty('payload');
      expect(res.body.data.events[0]).not.toHaveProperty('updatedAt');
    });
  });

  describe('GET /webhooks/events/:id', () => {
    it('returns webhook event details', async () => {
      const { cookies } = await createMember({
        features: ['read:webhook'],
        login: true,
      });
      const webhookEvent = await createWebhookEvent();

      const res = await api.get<GetWebhookEventResponse>(
        `/webhooks/events/${webhookEvent.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        id: webhookEvent.id,
        event: webhookEvent.event,
        status: webhookEvent.status,
        payload: webhookEvent.payload,
        updatedAt: webhookEvent.updatedAt.toISOString(),
        createdAt: webhookEvent.createdAt.toISOString(),
      });
    });

    it('blocks user without "read:webhook" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const webhookEvent = await createWebhookEvent();

      const res = await api.get(
        `/webhooks/events/${webhookEvent.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get(
        '/webhooks/events/00000000-0000-0000-0000-000000000000',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Evento de webhook não encontrado.');
    });
  });
});
