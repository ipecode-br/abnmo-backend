// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';

// import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';
// import { User } from '@/domain/entities/user';

// import { UsersController } from './users.controller';
// import { UsersRepository } from './users.repository';
// import { UsersService } from './users.service';

// @Module({
//   imports: [TypeOrmModule.forFeature([User])],
//   providers: [UsersService, UsersRepository, BcryptHasher],
//   controllers: [UsersController],
//   exports: [UsersRepository, UsersService],
// })
// export class UsersModule {}
