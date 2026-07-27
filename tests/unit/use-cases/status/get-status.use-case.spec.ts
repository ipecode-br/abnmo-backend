import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource } from 'typeorm';

import { GetStatusUseCase } from '@/app/http/status/use-cases/get-status.use-case';
import { SignatureService } from '@/app/signature/signature.service';
import { LogService } from '@/common/log/log.service';

describe('GetStatusUseCase', () => {
  let useCase: GetStatusUseCase;
  let dataSource: MockProxy<DataSource>;
  let signatureService: MockProxy<SignatureService>;
  let logger: { log: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    dataSource = mock<DataSource>();
    signatureService = mock<SignatureService>();
    logger = { log: jest.fn(), error: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        GetStatusUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: SignatureService, useValue: signatureService },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(GetStatusUseCase);
  });

  describe('Success', () => {
    it('returns ok when DB and signature are healthy', async () => {
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      signatureService.check.mockResolvedValue(true);

      const result = await useCase.execute();

      expect(result).toEqual({
        success: true,
        message: 'Sistema está operacional.',
        data: {
          api: { status: 'ok' },
          database: { status: 'ok' },
          signature: { status: 'ok' },
        },
      });
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });

  describe('Error', () => {
    it('returns error when DB query fails', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection refused'));
      signatureService.check.mockResolvedValue(true);

      const result = await useCase.execute();

      expect(result).toEqual({
        success: false,
        message: 'O banco de dados está indisponível.',
        data: {
          api: { status: 'ok' },
          database: { status: 'error' },
          signature: { status: 'ok' },
        },
      });
    });

    it('returns signature error when check returns false', async () => {
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      signatureService.check.mockResolvedValue(false);

      const result = await useCase.execute();

      expect(result).toEqual({
        success: true,
        message: 'Sistema está operacional.',
        data: {
          api: { status: 'ok' },
          database: { status: 'ok' },
          signature: { status: 'error' },
        },
      });
    });

    it('returns signature error when check throws', async () => {
      dataSource.query.mockResolvedValue([{ 1: 1 }]);
      signatureService.check.mockRejectedValue(new Error('Network error'));

      const result = await useCase.execute();

      expect(result).toEqual({
        success: true,
        message: 'Sistema está operacional.',
        data: {
          api: { status: 'ok' },
          database: { status: 'ok' },
          signature: { status: 'error' },
        },
      });
    });

    it('returns errors for both DB and signature', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection refused'));
      signatureService.check.mockRejectedValue(new Error('Network error'));

      const result = await useCase.execute();

      expect(result).toEqual({
        success: false,
        message: 'O banco de dados está indisponível.',
        data: {
          api: { status: 'ok' },
          database: { status: 'error' },
          signature: { status: 'error' },
        },
      });
    });
  });
});
