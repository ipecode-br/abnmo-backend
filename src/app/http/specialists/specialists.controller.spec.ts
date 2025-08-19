import { Test, TestingModule } from '@nestjs/testing';

import { SpecialistController } from './specialists.controller';
import { SpecialistsService } from './specialists.service';

describe('SpecialistController', () => {
  let controller: SpecialistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialistController],
      providers: [SpecialistsService],
    }).compile();

    controller = module.get<SpecialistController>(SpecialistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
