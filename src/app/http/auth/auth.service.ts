// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';

// import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';

// import { UsersService } from '../users/users.service';

// @Injectable()
// export class AuthService {
//   constructor(
//     private usersService: UsersService,
//     private jwtService: JwtService,
//     private bcript: BcryptHasher,
//   ) {}

//   async signIn(
//     email: string,
//     password: string,
//   ): Promise<{ access_token: string }> {
//     const user = await this.usersService.findByEmail(email);
//     if (!user) {
//       throw new UnauthorizedException('Usuário não enconbtrado!');
//     }

//     if (!user.data?.password) {
//       throw new UnauthorizedException('Senha não encontrada para o usuário!');
//     }
//     const verifyPassword = await this.bcript.compare(
//       password,
//       user.data.password,
//     );
//     if (!verifyPassword) {
//       throw new UnauthorizedException('Usuário não autorizado');
//     }

//     const payload = { sub: user.data.id, username: user.data.email };
//     return {
//       access_token: await this.jwtService.signAsync(payload),
//     };
//   }
// }
