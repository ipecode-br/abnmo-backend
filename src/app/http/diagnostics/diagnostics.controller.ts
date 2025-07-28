// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Logger,
//   Param,
//   ParseIntPipe,
//   Post,
// } from '@nestjs/common';
// import {
//   ApiBody,
//   ApiOperation,
//   ApiParam,
//   ApiResponse,
//   ApiTags,
// } from '@nestjs/swagger';

// import { Diagnostic } from '@/domain/entities/diagnostic';
// import { EnvelopeDTO } from '@/utils/envelope.dto';
// import { validateDto } from '@/utils/validate.dto';

// import { DiagnosticsService } from './diagnostics.service';
// import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';

// @ApiTags('Diagnósticos')
// @Controller('diagnostics')
// export class DiagnosticsController {
//   private readonly logger = new Logger(DiagnosticsController.name);

//   constructor(private readonly diagnosticsService: DiagnosticsService) {}

//   @Post()
//   @ApiOperation({ summary: 'Cria um novo diagnóstico' })
//   @ApiResponse({ status: 201, description: 'Diagnóstico criado com sucesso' })
//   @ApiResponse({ status: 400, description: 'Dados inválidos' })
//   @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
//   @ApiBody({ type: CreateDiagnosticDto })
//   public async create(
//     @Body() createDiagnosticDto: CreateDiagnosticDto,
//   ): Promise<EnvelopeDTO<Diagnostic, undefined>> {
//     try {
//       await validateDto(createDiagnosticDto);
//       const diagnostic =
//         await this.diagnosticsService.create(createDiagnosticDto);
//       if (!diagnostic) {
//         return {
//           success: false,
//           message: 'Erro ao criar Diagnóstico!',
//           data: undefined,
//         };
//       }
//       this.logger.log(
//         `Diagnóstico criado com sucesso: ${JSON.stringify(diagnostic)}`,
//       );
//       return {
//         success: true,
//         message: 'Diagnóstico criado com sucesso',
//         data: diagnostic,
//       };
//     } catch (error: unknown) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao criar diagnóstico',
//         data: undefined,
//       };
//     }
//   }

//   @Get()
//   @ApiOperation({ summary: 'Retorna todos os diagnósticos' })
//   @ApiResponse({
//     status: 200,
//     description: 'Lista de diagnósticos retornada com sucesso',
//     type: [Diagnostic],
//   })
//   public async findAll(): Promise<EnvelopeDTO<Diagnostic[], undefined>> {
//     try {
//       const diagnostics = await this.diagnosticsService.findAll();
//       if (!diagnostics) {
//         return {
//           success: false,
//           message: 'Erro ao retornar lista de diagnósticos',
//           data: undefined,
//         };
//       }
//       return {
//         success: true,
//         message: 'Lista de diagnósticos',
//         data: diagnostics,
//       };
//     } catch (error: unknown) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao retornar lista de diagnósticos',
//         data: undefined,
//       };
//     }
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Busca um diagnóstico pelo ID' })
//   @ApiResponse({ status: 200, description: 'Diagnóstico encontrado' })
//   @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
//   @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
//   public async findById(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<EnvelopeDTO<Diagnostic, undefined>> {
//     try {
//       const diagnostic = await this.diagnosticsService.findById(id);
//       if (!diagnostic) {
//         return {
//           success: false,
//           message: 'Diagnóstico não encontrado',
//           data: undefined,
//         };
//       }
//       this.logger.log(`Diagnóstico encontrado`);
//       return {
//         success: true,
//         message: 'Diagnóstico encontrado',
//         data: diagnostic,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao encontrar diagnóstico',
//         data: undefined,
//       };
//     }
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Remove um diagnóstico pelo ID' })
//   @ApiResponse({ status: 200, description: 'Diagnóstico removido com sucesso' })
//   @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
//   @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
//   public async remove(@Param('id', ParseIntPipe) id: number) {
//     try {
//       const diagnostic = await this.diagnosticsService.remove(id);
//       if (!diagnostic) {
//         return {
//           success: false,
//           message: 'Erro ao remover diagnóstico',
//           data: diagnostic,
//         };
//       }
//       this.logger.log(
//         `Diagnóstico removido com sucesso: ${JSON.stringify(diagnostic)}`,
//       );
//       return {
//         success: true,
//         message: 'Diagnóstico removido com sucesso',
//         data: diagnostic,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro intertno ao remover diagnóstico',
//         data: null,
//       };
//     }
//   }
// }
