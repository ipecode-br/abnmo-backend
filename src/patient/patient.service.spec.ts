import { Test, TestingModule } from '@nestjs/testing';
import { PacienteService } from './patient.service';

describe('PacienteService', () => {
  let service: PacienteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PacienteService],
    }).compile();

    service = module.get<PacienteService>(PacienteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
