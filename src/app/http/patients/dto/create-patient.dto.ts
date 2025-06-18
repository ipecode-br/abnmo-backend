// import { ApiProperty } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';
// import {
//   IsBoolean,
//   IsIn,
//   IsInt,
//   IsISO8601,
//   IsOptional,
//   IsString,
//   IsUrl,
//   Length,
//   Matches,
//   MaxLength,
// } from 'class-validator';

// import { brazilianStates } from '@/utils/brazilian-states';

// export class CreatePatientDto {
//   @ApiProperty({
//     example: 'Feminino',
//     description:
//       'Gênero do usuário (exemplo: Masculino, Feminino, Não-binário).',
//     required: true,
//   })
//   @IsString({ message: 'A descrição do gênero deve ser uma string' })
//   @MaxLength(100, {
//     message: 'A descrição do gênero deve ter no máximo 100 caracteres',
//   })
//   desc_gender: string;

//   @ApiProperty({
//     example: '1995-08-25',
//     description: 'Data de nascimento do paciente (YYYY-MM-DD).',
//     required: true,
//   })
//   @IsISO8601({}, { message: 'Informe uma data no formato YYYY-MM-DD' })
//   birth_of_date: string;

//   @ApiProperty({
//     example: 'São Paulo',
//     description: 'Cidade onde o usuário reside.',
//     required: true,
//   })
//   @IsString({ message: 'A cidade do paciente deve ser uma string' })
//   @MaxLength(50, { message: 'A cidade deve ter no máximo 50 caracteres' })
//   city: string;

//   @ApiProperty({
//     example: 'SP',
//     description: 'Sigla do estado (exemplo: SP, RJ, MG).',
//     required: true,
//   })
//   @Transform(({ value }: { value: unknown }): string | undefined =>
//     typeof value === 'string' ? value.toUpperCase() : undefined,
//   )
//   @IsIn(brazilianStates, {
//     message: 'Estado inválido. Use uma sigla de estado brasileira válida.',
//   })
//   @IsString({ message: 'A sigla do estado deve ser uma string' })
//   @Length(2, 2, {
//     message: 'A sigla do estado deve ter exatamente 2 caracteres',
//   })
//   state: string;

//   @ApiProperty({
//     example: '11987654321',
//     description: 'Número de WhatsApp do usuário (somente números, 11 dígitos).',
//     required: true,
//   })
//   @IsString({ message: 'O Whatsapp deve ser uma string' })
//   @Matches(/^\d{11}$/, { message: 'O Whatsapp deve conter apenas números' })
//   @Length(11, 11, { message: 'O Whatsapp deve ter exatamente 11 dígitos' })
//   whatsapp: string;

//   @ApiProperty({
//     example: '12345678901',
//     description: 'CPF do usuário (apenas números, 11 dígitos).',
//     required: true,
//   })
//   @IsString({ message: 'O CPF deve ser uma string' })
//   @Matches(/^\d{11}$/, { message: 'O CPF deve conter apenas números' })
//   @Length(11, 11, { message: 'O CPF deve ter exatamente 11 dígitos' })
//   cpf: string;

//   @ApiProperty({
//     example: 'https://example.com/uploads/profile.jpg',
//     description: 'URL da foto de perfil do usuário. Deve ser um link válido.',
//     required: true,
//   })
//   @IsUrl({}, { message: 'A URL da foto deve ser válida' })
//   @MaxLength(255, {
//     message: 'A URL da foto deve ter no máximo 255 caracteres',
//   })
//   url_photo: string;

//   @ApiProperty({
//     example: 'true',
//     description: 'Indica se o usuário possui alguma deficiência.',
//     required: true,
//   })
//   @IsBoolean({
//     message: 'Possui deficiência deve ser um booleano (true ou false)',
//   })
//   have_disability: boolean;

//   @ApiProperty({
//     example: 'Deficiência visual e auditiva',
//     description:
//       'Descrição detalhada da(s) deficiência(s) do usuário, se houver.',
//     required: false,
//   })
//   @IsOptional()
//   @IsString({ message: 'A descrição de deficiências deve ser uma string' })
//   @MaxLength(500, {
//     message: 'A descrição de deficiências deve ter no máximo 500 caracteres',
//   })
//   desc_disability?: string;

//   @ApiProperty({
//     example: 'true',
//     description: 'Indica se o usuário precisa de assistência legal.',
//     required: true,
//   })
//   @IsBoolean({
//     message:
//       'Precisa de assistência legal deve ser um booleano (true ou false)',
//   })
//   need_legal_help: boolean;

//   @ApiProperty({
//     example: 'true',
//     description: 'Indica se o usuário faz uso contínuo de medicamentos.',
//     required: true,
//   })
//   @IsBoolean({
//     message: 'Usa medicamento deve ser um booleano (true ou false)',
//   })
//   use_medicine: boolean;

//   @ApiProperty({
//     example: 'Medicamento para pressão alta, uso diário.',
//     description:
//       'Descrição detalhada do(s) medicamento(s) utilizado(s) pelo usuário, se houver.',
//     required: false,
//   })
//   @IsOptional()
//   @IsString({ message: 'A descrição dos medicamentos deve ser uma string' })
//   @MaxLength(500, {
//     message: 'A descrição dos medicamentos deve ter no máximo 500 caracteres',
//   })
//   desc_medicine?: string;

//   @ApiProperty({
//     example: 'diagnostico_usuario.pdf',
//     description: 'Nome do arquivo contendo o diagnóstico médico.',
//     required: false,
//   })
//   @IsOptional()
//   @IsString({ message: 'O arquivo do diagnóstico deve ser uma string' })
//   @MaxLength(200, {
//     message: 'O arquivo do diagnóstico deve ter no máximo 200 caracteres',
//   })
//   filename_diagnostic?: string;

//   @ApiProperty({
//     example: 1,
//     description: 'Identificador único do diagnóstico.',
//     required: true,
//   })
//   @IsInt({ message: 'O id_diagnostico deve ser um número inteiro' })
//   id_diagnostic: number;

//   @ApiProperty({
//     example: 1,
//     description: 'Identificador único do usuário',
//     required: true,
//   })
//   @IsInt({ message: 'O id_usuario deve ser um número inteiro' })
//   id_user: number;
// }
