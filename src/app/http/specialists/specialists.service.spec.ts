import { Test, TestingModule } from '@nestjs/testing';

import { SpecialistsService } from './specialists.service';

describe('SpecialistsService', () => {
  let service: SpecialistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecialistsService],
    }).compile();

    service = module.get<SpecialistsService>(SpecialistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
