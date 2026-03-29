import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';
import type { NotificationRecipientType } from '@/domain/enums/notifications';

import {
  CreateNotificationDto,
  GetNotificationsQuery,
  GetNotificationsResponse,
  GetUnreadNotificationsCountResponse,
} from './notifications.dtos';
import { CreateNotificationUseCase } from './use-cases/create-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { GetUnreadNotificationsCountUseCase } from './use-cases/get-unread-notifications-count.use-case';
import { MarkAllNotificationsAsReadUseCase } from './use-cases/mark-all-notifications-as-read.use-case';
import { MarkNotificationAsReadUseCase } from './use-cases/mark-notification-as-read.use-case';

@ApiTags('Notificações')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getUnreadNotificationsCountUseCase: GetUnreadNotificationsCountUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllNotificationsAsReadUseCase: MarkAllNotificationsAsReadUseCase,
  ) {}

  @Get()
  @Roles(['all'])
  @ApiOperation({ summary: 'Lista as notificações do usuário autenticado' })
  @ApiResponse({ type: GetNotificationsResponse })
  async getNotifications(
    @Query() query: GetNotificationsQuery,
    @User() user: AuthUser,
  ): Promise<GetNotificationsResponse> {
    const recipientType = this.resolveRecipientType(user);
    const data = await this.getNotificationsUseCase.execute({
      recipientType,
      recipientId: user.id,
      page: query.page,
      limit: query.limit,
    });

    return {
      success: true,
      message: 'Lista de notificações retornada com sucesso.',
      data,
    };
  }

  @Get('unread-count')
  @Roles(['all'])
  @ApiOperation({ summary: 'Retorna a contagem de notificações não lidas' })
  @ApiResponse({ type: GetUnreadNotificationsCountResponse })
  async getUnreadCount(
    @User() user: AuthUser,
  ): Promise<GetUnreadNotificationsCountResponse> {
    const recipientType = this.resolveRecipientType(user);
    const data = await this.getUnreadNotificationsCountUseCase.execute({
      recipientType,
      recipientId: user.id,
    });

    return {
      success: true,
      message: 'Contagem de notificações não lidas retornada com sucesso.',
      data,
    };
  }

  @Patch('read-all')
  @Roles(['all'])
  @ApiOperation({ summary: 'Marca todas as notificações como lidas' })
  @ApiResponse({ type: BaseResponse })
  async markAllAsRead(@User() user: AuthUser): Promise<BaseResponse> {
    const recipientType = this.resolveRecipientType(user);
    await this.markAllNotificationsAsReadUseCase.execute({
      recipientType,
      recipientId: user.id,
    });

    return {
      success: true,
      message: 'Todas as notificações foram marcadas como lidas.',
    };
  }

  @Patch(':id/read')
  @Roles(['all'])
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  @ApiResponse({ type: BaseResponse })
  async markAsRead(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    const recipientType = this.resolveRecipientType(user);
    await this.markNotificationAsReadUseCase.execute({
      notificationId: id,
      recipientType,
      recipientId: user.id,
    });

    return {
      success: true,
      message: 'Notificação marcada como lida.',
    };
  }

  @Post()
  @Roles(['admin', 'manager'])
  @ApiOperation({ summary: 'Cria e envia uma nova notificação' })
  @ApiResponse({ type: BaseResponse })
  async create(
    @Body() dto: CreateNotificationDto,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.createNotificationUseCase.execute({
      ...dto,
      type: dto.type ?? undefined,
      createdByUserId: user.id,
    });

    return {
      success: true,
      message: 'Notificação criada e enviada com sucesso.',
    };
  }

  private resolveRecipientType(user: AuthUser): NotificationRecipientType {
    return user.role === 'patient' ? 'patient' : 'user';
  }
}
