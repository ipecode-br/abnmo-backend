// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import * as bcrypt from 'bcryptjs';

// import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';
// import type { User } from '@/domain/entities/user';
// import { EnvelopeDTO } from '@/utils/envelope.dto';

// import { AuthDto } from '../auth/dto/auth.dto';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { UsersRepository } from './users.repository';

// @Injectable()
// export class UsersService {
//   constructor(
//     private readonly userRepository: UsersRepository,
//     private bcryptHasher: BcryptHasher,
//   ) {}

//   async create(createUserDto: CreateUserDto): Promise<User> {
//     const userExists = await this.userRepository.findByEmail(
//       createUserDto.email,
//     );

//     if (userExists) {
//       throw new BadRequestException('Já existe um usuário com este e-mail.');
//     }

//     createUserDto.flag_login_facebook =
//       createUserDto.flag_login_facebook ?? false;
//     createUserDto.flag_login_gmail = createUserDto.flag_login_gmail ?? false;
//     createUserDto.flag_active = createUserDto.flag_active ?? true;
//     createUserDto.flag_is_removed = createUserDto.flag_is_removed ?? false;
//     if (createUserDto.password) {
//       createUserDto.password = await this.bcryptHasher.hash(
//         createUserDto.password,
//       );
//     }
//     // if (!createUserDto.createdAt) {
//     //   createUserDto.createdAt = new Date();
//     // }
//     const user = this.userRepository.create(createUserDto);
//     return user;
//   }

//   async findAll(): Promise<User[]> {
//     return await this.userRepository.findAll();
//   }

//   async findByEmail(email: string): Promise<EnvelopeDTO<AuthDto, undefined>> {
//     const user = await this.userRepository.findByEmail(email);

//     if (!user) {
//       throw new NotFoundException('Usuário não encontrado.');
//     }

//     const modelUserDto = new AuthDto();
//     modelUserDto.id = user.id;
//     modelUserDto.email = user?.email;
//     modelUserDto.token_oauth = user.token_oauth;
//     if (user.password) {
//       modelUserDto.password = user.password;
//     }
//     return {
//       success: true,
//       message: 'Usuario retornado para o login!',
//       data: modelUserDto,
//     };
//   }
//   async findById(id: number): Promise<User> {
//     const user = await this.userRepository.findById(id);

//     if (!user) {
//       throw new NotFoundException('Usuário não encontrado.');
//     }

//     return user;
//   }

//   async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
//     const userExists = await this.userRepository.findById(id);

//     if (!userExists) {
//       throw new NotFoundException('Usuário não encontrado.');
//     }

//     // Verifica se a senha foi enviada no update
//     if (updateUserDto.password) {
//       const saltRounds = 10;
//       updateUserDto.password = await bcrypt.hash(
//         updateUserDto.password,
//         saltRounds,
//       );
//     }

//     //Atualiza os campos alterados
//     Object.assign(userExists, updateUserDto);

//     const user = await this.userRepository.update(userExists);

//     return user;
//   }

//   async remove(id: number): Promise<User> {
//     const userExists = await this.userRepository.findById(id);

//     if (!userExists) {
//       throw new NotFoundException('Usuário não encontrado.');
//     }

//     const user = await this.userRepository.remove(userExists);

//     return user;
//   }
// }
