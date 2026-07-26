import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { webhookEventFactory } from 'tests/config/factories/webhook-event.factory';
import { Repository } from 'typeorm';

import { GetWebhookEventsUseCase } from '@/app/http/webhooks/use-cases/get-webhook-events.use-case';
import { WebhookEvent } from '@/domain/entities/webhook-event';

describe('GetWebhookEventsUseCase', () => {
  let useCase: GetWebhookEventsUseCase;
  let webhookEventsRepo: MockProxy<Repository<WebhookEvent>>;

  const admin = requestUserFactory({ role: 'admin' });
  const user = requestUserFactory({ features: ['read:webhook'] });

  const makeEvent = (overrides?: Partial<WebhookEvent>) =>
    webhookEventFactory({ ...overrides } as Partial<WebhookEvent>);

  const evtA = makeEvent({
    id: 'event-a',
    event: 'sign_survey',
    status: 'received',
  });
  const evtB = makeEvent({
    id: 'event-b',
    event: 'sign_survey',
    status: 'success',
  });

  beforeEach(async () => {
    webhookEventsRepo = mock<Repository<WebhookEvent>>();

    const module = await Test.createTestingModule({
      providers: [
        GetWebhookEventsUseCase,
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: webhookEventsRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetWebhookEventsUseCase);
  });

  it('returns paginated events for admin', async () => {
    webhookEventsRepo.count.mockResolvedValue(2);
    webhookEventsRepo.find.mockResolvedValue([evtA, evtB]);

    const result = await useCase.execute({
      user: admin,
      page: 1,
      perPage: 20,
    });

    expect(webhookEventsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(result.total).toBe(2);
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toEqual({
      id: evtA.id,
      event: evtA.event,
      status: evtA.status,
      createdAt: evtA.createdAt,
    });
    expect(result.events[1]).toEqual({
      id: evtB.id,
      event: evtB.event,
      status: evtB.status,
      createdAt: evtB.createdAt,
    });
  });

  it('returns paginated events with "read:webhook" feature', async () => {
    webhookEventsRepo.count.mockResolvedValue(1);
    webhookEventsRepo.find.mockResolvedValue([evtA]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 20,
    });

    expect(result.events).toHaveLength(1);
  });

  it('throws "ForbiddenException" without matching features', async () => {
    const blocked = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({ user: blocked, page: 1, perPage: 20 }),
    ).rejects.toThrow(ForbiddenException);

    expect(webhookEventsRepo.count).not.toHaveBeenCalled();
  });

  it('filters by event type', async () => {
    webhookEventsRepo.count.mockResolvedValue(1);
    webhookEventsRepo.find.mockResolvedValue([evtA]);

    const result = await useCase.execute({
      user: admin,
      page: 1,
      perPage: 20,
      event: 'sign_survey',
    });

    expect(webhookEventsRepo.count).toHaveBeenCalled();
    expect(result.events).toHaveLength(1);
  });

  it('filters by status', async () => {
    webhookEventsRepo.count.mockResolvedValue(1);
    webhookEventsRepo.find.mockResolvedValue([evtB]);

    const result = await useCase.execute({
      user: admin,
      page: 1,
      perPage: 20,
      status: 'success',
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].status).toBe('success');
  });

  it('orders by the specified field', async () => {
    webhookEventsRepo.count.mockResolvedValue(1);
    webhookEventsRepo.find.mockResolvedValue([evtA]);

    await useCase.execute({
      user: admin,
      page: 1,
      perPage: 20,
      orderBy: 'status',
      order: 'ASC',
    });

    expect(webhookEventsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { status: 'ASC' } }),
    );
  });

  it('paginates correctly', async () => {
    webhookEventsRepo.count.mockResolvedValue(25);
    webhookEventsRepo.find.mockResolvedValue([evtA]);

    await useCase.execute({ user: admin, page: 2, perPage: 10 });

    expect(webhookEventsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('handles empty result', async () => {
    webhookEventsRepo.count.mockResolvedValue(0);
    webhookEventsRepo.find.mockResolvedValue([]);

    const result = await useCase.execute({
      user: admin,
      page: 1,
      perPage: 20,
    });

    expect(result.total).toBe(0);
    expect(result.events).toHaveLength(0);
  });
});
