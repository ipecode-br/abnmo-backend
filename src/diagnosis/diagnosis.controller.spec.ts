import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

describe('DiagnosisController', () => {
  let controller: DiagnosisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosisController],
      providers: [DiagnosisService],
    }).compile();

    controller = module.get<DiagnosisController>(DiagnosisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
