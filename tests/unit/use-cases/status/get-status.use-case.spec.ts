import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource } from 'typeorm';

import { GetStatusUseCase } from '@/app/http/status/use-cases/get-status.use-case';
import { LogService } from '@/common/log/log.service';

describe('GetStatusUseCase', () => {
  let useCase: GetStatusUseCase;
  let dataSource: MockProxy<DataSource>;

  beforeEach(async () => {
    dataSource = mock<DataSource>();

    const module = await Test.createTestingModule({
      providers: [
        GetStatusUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: LogService, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetStatusUseCase);
  });

  describe('Success', () => {
    it('returns ok when DB is healthy', async () => {
      dataSource.query.mockResolvedValue([{ 1: 1 }]);

      const result = await useCase.execute();

      expect(result).toEqual({
        success: true,
        message: 'Sistema está operacional.',
        data: {
          api: { status: 'ok' },
          database: { status: 'ok' },
        },
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });

  describe('Error', () => {
    it('returns error when DB query fails', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection refused'));

      const result = await useCase.execute();

      expect(result).toEqual({
        success: false,
        message: 'O banco de dados está indisponível.',
        data: {
          api: { status: 'ok' },
          database: { status: 'error' },
        },
      });
    });
  });
});
