import { createHmac } from 'node:crypto';

import { INestApplication } from '@nestjs/common';

import { Survey } from '@/domain/entities/survey';
import { EnvService } from '@/env/env.service';

import type { BaseResponseBody } from '../config/api-client';
import { ApiClient, createApiClient } from '../config/api-client';
import { createPatient } from '../config/helpers';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';
import { createSurvey } from '../helpers/surveys';

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
    it('returns 401 when content-hmac header is missing', async () => {
      const res = await api.post('/webhooks/signatures/survey', makePayload());

      expect(res.status).toBe(401);
    });

    it('returns 401 when HMAC is invalid', async () => {
      const res = await api.post('/webhooks/signatures/survey', makePayload(), {
        headers: {
          'content-hmac':
            'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        },
      });

      expect(res.status).toBe(401);
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
    });

    it('completes survey when metadata matches and event is completion', async () => {
      const { patient } = await createPatient();
      const survey = await createSurvey({
        status: 'pending_signature',
        signatureId: DOCUMENT_KEY,
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

      const dataSource = getTestDataSource();
      const updated = await dataSource.getRepository(Survey).findOne({
        where: { id: survey.id },
      });
      expect(updated?.status).toBe('completed');
    });

    it('returns 404 when survey is not found', async () => {
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

      expect(res.status).toBe(404);
    });
  });
});
