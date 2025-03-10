import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticoService } from './diagnostico.service';

describe('DiagnosticoService', () => {
  let service: DiagnosticoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiagnosticoService],
    }).compile();

    service = module.get<DiagnosticoService>(DiagnosticoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
