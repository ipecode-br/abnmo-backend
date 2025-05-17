import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Support } from './entities/support.entity';
import { validateDto } from 'src/common/utils/validate.dto';

@ApiTags('Apoios')
@Controller('support')
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo apoio' })
  @ApiResponse({
    status: 201,
    description: 'Apoio criado com sucesso',
    type: Support,
  })
  @ApiResponse({
    status: 409,
    description: 'Apoio já cadastrado para esse paciente',
  })
  public async create(
    @Body() createSupportDto: CreateSupportDto,
  ): Promise<Support> {
    await validateDto(createSupportDto);

    const support = await this.supportService.create(createSupportDto);

    this.logger.log(`Apoio criado com sucesso: ${JSON.stringify(support)}`);

    return support;
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os apoios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de apoios',
    type: [Support],
  })
  public async findAll(): Promise<Support[]> {
    return await this.supportService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio encontrado',
    type: Support,
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Support> {
    const support = await this.supportService.findById(id);

    this.logger.log(`Apoio encontrado`);

    return support;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um apoio pelo ID' })
  @ApiResponse({ status: 200, description: 'Apoio removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async remove(@Param('id', ParseIntPipe) id: number): Promise<Support> {
    const support = await this.supportService.remove(id);

    this.logger.log(`Apoio removido com sucesso: ${JSON.stringify(support)}`);

    return support;
  }
}
