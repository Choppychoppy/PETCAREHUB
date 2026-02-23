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

import { ConsultationService } from './consultation.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateConsultationMessageDto } from './dto/create-consultation-message.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Consultation')
@Controller('consultation')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new consultation request' })
  @ApiResponse({ status: 201, description: 'Consultation created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createConsultation(
    @CurrentUser('id') userId: string,
    @Body() createConsultationDto: CreateConsultationDto,
  ) {
    return this.consultationService.createConsultation(userId, createConsultationDto);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user consultations' })
  @ApiResponse({ status: 200, description: 'User consultations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserConsultations(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.consultationService.findUserConsultations(userId, page, limit);
  }

  @Get('vet')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vet consultations (Staff)' })
  @ApiResponse({ status: 200, description: 'Vet consultations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Staff only' })
  getVetConsultations(
    @CurrentUser('id') vetId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.consultationService.findVetConsultations(vetId, page, limit, status);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all consultations (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Consultations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  getAllConsultations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.consultationService.findAllConsultations(page, limit, status, type);
  }

  @Get('available-vets')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get available vets (Admin)' })
  @ApiResponse({ status: 200, description: 'Available vets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAvailableVets() {
    return this.consultationService.getAvailableVets();
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get consultation statistics (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  getStats() {
    return this.consultationService.getConsultationStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get consultation by ID' })
  @ApiResponse({ status: 200, description: 'Consultation retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  getConsultation(@Param('id') id: string) {
    return this.consultationService.findConsultationById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update consultation (Admin/Staff)' })
  @ApiResponse({ status: 200, description: 'Consultation updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  updateConsultation(
    @Param('id') id: string,
    @CurrentUser('role') userRole: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
  ) {
    return this.consultationService.updateConsultation(id, updateConsultationDto, userRole);
  }

  @Put(':id/assign')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign vet to consultation (Admin)' })
  @ApiResponse({ status: 200, description: 'Vet assigned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  assignVet(
    @Param('id') consultationId: string,
    @Body('vetId') vetId: string,
  ) {
    return this.consultationService.assignVet(consultationId, vetId);
  }

  @Post(':id/messages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add message to consultation' })
  @ApiResponse({ status: 201, description: 'Message added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not part of consultation' })
  addMessage(
    @Param('id') consultationId: string,
    @CurrentUser('id') senderId: string,
    @Body() createConsultationMessageDto: CreateConsultationMessageDto,
  ) {
    return this.consultationService.addMessage(consultationId, senderId, createConsultationMessageDto);
  }

  @Put(':id/messages/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark consultation messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not part of consultation' })
  markMessagesAsRead(
    @Param('id') consultationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consultationService.markMessagesAsRead(consultationId, userId);
  }
}