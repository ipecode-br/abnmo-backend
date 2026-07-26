import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { webhookEventFactory } from 'tests/config/factories/webhook-event.factory';
import { Repository } from 'typeorm';

import { GetWebhookEventUseCase } from '@/app/http/webhooks/use-cases/get-webhook-event.use-case';
import { WebhookEvent } from '@/domain/entities/webhook-event';

describe('GetWebhookEventUseCase', () => {
  let useCase: GetWebhookEventUseCase;
  let webhookEventsRepo: MockProxy<Repository<WebhookEvent>>;

  const webhookEvent = webhookEventFactory({
    id: 'event-id',
    event: 'sign_survey',
    status: 'received',
    payload: { document: { key: 'doc-key' } },
  });

  beforeEach(async () => {
    webhookEventsRepo = mock<Repository<WebhookEvent>>();

    const module = await Test.createTestingModule({
      providers: [
        GetWebhookEventUseCase,
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: webhookEventsRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetWebhookEventUseCase);
  });

  it('returns webhook event details for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    webhookEventsRepo.findOne.mockResolvedValue(webhookEvent);

    const result = await useCase.execute({ id: webhookEvent.id, user });

    expect(webhookEventsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: webhookEvent.id } }),
    );
    expect(result).toEqual({
      id: webhookEvent.id,
      event: webhookEvent.event,
      status: webhookEvent.status,
      payload: webhookEvent.payload,
      updatedAt: webhookEvent.updatedAt,
      createdAt: webhookEvent.createdAt,
    });
  });

  it('returns webhook event details with "read:webhook" feature', async () => {
    const user = requestUserFactory({ features: ['read:webhook'] });
    webhookEventsRepo.findOne.mockResolvedValue(webhookEvent);

    const result = await useCase.execute({ id: webhookEvent.id, user });

    expect(result.id).toBe(webhookEvent.id);
  });

  it('throws "ForbiddenException" without matching features', async () => {
    const user = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({ id: webhookEvent.id, user }),
    ).rejects.toThrow(ForbiddenException);

    expect(webhookEventsRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws "NotFoundException" when event does not exist', async () => {
    const user = requestUserFactory({ role: 'admin' });
    webhookEventsRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent', user })).rejects.toThrow(
      NotFoundException,
    );
  });
});
