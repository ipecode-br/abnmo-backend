import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Certifique-se de que o repositório do usuário foi adicionado aqui
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
