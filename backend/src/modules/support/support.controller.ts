import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { CreatePublicContactDto } from './dto/create-public-contact.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // Public endpoint - no authentication required
  @Post('contact')
  @ApiOperation({ summary: 'Submit public contact form (no auth required)' })
  @ApiResponse({ status: 201, description: 'Contact message submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createPublicContact(@Body() createPublicContactDto: CreatePublicContactDto) {
    return this.supportService.createPublicContact(createPublicContactDto);
  }

  @Post('tickets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createTicket(
    @CurrentUser('id') userId: string,
    @Body() createSupportTicketDto: CreateSupportTicketDto,
  ) {
    return this.supportService.createTicket(userId, createSupportTicketDto);
  }

  @Get('tickets/my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiResponse({ status: 200, description: 'User tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.supportService.findUserTickets(userId, page, limit);
  }

  @Get('tickets')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all support tickets (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  getAllTickets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.findAllTickets(page, limit, status, priority, search);
  }

  @Get('tickets/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getTicket(@Param('id') id: string) {
    return this.supportService.findTicketById(id);
  }

  @Put('tickets/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update support ticket (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  updateTicket(
    @Param('id') id: string,
    @CurrentUser('id') staffId: string,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto,
  ) {
    return this.supportService.updateTicket(id, updateSupportTicketDto, staffId);
  }

  @Post('tickets/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add message to ticket' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your ticket' })
  addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() createSupportMessageDto: CreateSupportMessageDto,
  ) {
    return this.supportService.addMessage(ticketId, userId, createSupportMessageDto, userRole);
  }

  @Put('tickets/:id/assign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign ticket to staff (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  assignTicket(
    @Param('id') ticketId: string,
    @CurrentUser('id') assignedById: string,
    @Body('staffId') staffId: string,
  ) {
    return this.supportService.assignTicket(ticketId, staffId, assignedById);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get support ticket statistics (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  getStats() {
    return this.supportService.getTicketStats();
  }
}