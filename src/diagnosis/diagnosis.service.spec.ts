import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosisService } from './diagnosis.service';

describe('DiagnosisService', () => {
  let service: DiagnosisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagnosisService],
    }).compile();

    service = module.get<DiagnosisService>(DiagnosisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
