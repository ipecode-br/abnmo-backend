import { INestApplication } from '@nestjs/common';

import type { GetStatusResponse } from '@/app/http/status/status.dtos';

import { ApiClient, createApiClient } from '../config/api-client';
import { getTestApp } from '../config/setup-e2e';

describe('Status (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  it('returns status', async () => {
    const res = await api.get<GetStatusResponse>('/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Sistema está operacional.');
    expect(res.body.data.api.status).toBe('ok');
    expect(res.body.data.database.status).toBe('ok');
    expect(res.body.data.signature.status).toBe('ok');
  });
});
