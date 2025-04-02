import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticoController } from './diagnosis.controller';
import { DiagnosticoService } from './diagnosis.service';

describe('DiagnosticoController', () => {
  let controller: DiagnosticoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticoController],
      providers: [DiagnosticoService],
    }).compile();

    controller = module.get<DiagnosticoController>(DiagnosticoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
