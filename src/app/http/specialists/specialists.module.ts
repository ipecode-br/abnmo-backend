// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

// import { CryptographyModule } from '@/app/cryptography/cryptography.module';
// import { Specialist } from '@/domain/entities/specialist';
// import { EnvModule } from '@/env/env.module';

// import { AuthModule } from '../auth/auth.module';
// import { SpecialistsController } from './specialists.controller';
// import { SpecialistsRepository } from './specialists.repository';
// import { SpecialistsService } from './specialists.service';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Specialist]),
//     CryptographyModule,
//     AuthModule,
//     EnvModule,
//   ],
//   controllers: [SpecialistsController],
//   providers: [SpecialistsService, SpecialistsRepository],
//   exports: [SpecialistsRepository],
// })
// export class SpecialistsModule {}
