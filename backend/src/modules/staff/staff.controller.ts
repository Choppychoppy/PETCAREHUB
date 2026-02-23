import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { StaffService } from './staff.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // Staff Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get staff dashboard data' })
  @ApiResponse({ status: 200, description: 'Staff dashboard data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Staff only' })
  getStaffDashboard(@CurrentUser('id') staffId: string) {
    return this.staffService.getStaffDashboard(staffId);
  }

  // Appointment Management
  @Get('appointments')
  @ApiOperation({ summary: 'Get staff appointments' })
  @ApiResponse({ status: 200, description: 'Staff appointments retrieved successfully' })
  getStaffAppointments(
    @CurrentUser('id') staffId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.staffService.getStaffAppointments(staffId, page, limit, { status, date });
  }

  @Get('appointments/today')
  @ApiOperation({ summary: 'Get today appointments for staff' })
  @ApiResponse({ status: 200, description: 'Today appointments retrieved successfully' })
  getTodayAppointments(@CurrentUser('id') staffId: string) {
    return this.staffService.getTodayAppointments(staffId);
  }

  @Put('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status updated successfully' })
  updateAppointmentStatus(
    @Param('id') appointmentId: string,
    @CurrentUser('id') staffId: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.staffService.updateAppointmentStatus(appointmentId, staffId, status, notes);
  }

  @Post('appointments/:id/complete')
  @ApiOperation({ summary: 'Complete appointment with details' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  completeAppointment(
    @Param('id') appointmentId: string,
    @CurrentUser('id') staffId: string,
    @Body() completionData: {
      diagnosis: string;
      treatment: string;
      prescription?: string;
      followUpDate?: Date;
      notes?: string;
    },
  ) {
    return this.staffService.completeAppointment(appointmentId, staffId, completionData);
  }

  // Consultation Management
  @Get('consultations/assigned')
  @ApiOperation({ summary: 'Get assigned consultations' })
  @ApiResponse({ status: 200, description: 'Assigned consultations retrieved successfully' })
  getAssignedConsultations(
    @CurrentUser('id') staffId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ) {
    return this.staffService.getAssignedConsultations(staffId, page, limit, status);
  }

  @Get('consultations/available')
  @ApiOperation({ summary: 'Get available consultations to claim' })
  @ApiResponse({ status: 200, description: 'Available consultations retrieved successfully' })
  getAvailableConsultations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.staffService.getAvailableConsultations(page, limit);
  }

  @Post('consultations/:id/claim')
  @ApiOperation({ summary: 'Claim consultation' })
  @ApiResponse({ status: 200, description: 'Consultation claimed successfully' })
  claimConsultation(
    @Param('id') consultationId: string,
    @CurrentUser('id') staffId: string,
  ) {
    return this.staffService.claimConsultation(consultationId, staffId);
  }

  // Customer Support
  @Get('support/assigned')
  @ApiOperation({ summary: 'Get assigned support tickets' })
  @ApiResponse({ status: 200, description: 'Assigned support tickets retrieved successfully' })
  getAssignedTickets(
    @CurrentUser('id') staffId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.staffService.getAssignedTickets(staffId, page, limit, { status, priority });
  }

  @Get('support/unassigned')
  @ApiOperation({ summary: 'Get unassigned support tickets' })
  @ApiResponse({ status: 200, description: 'Unassigned support tickets retrieved successfully' })
  getUnassignedTickets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('priority') priority?: string,
  ) {
    return this.staffService.getUnassignedTickets(page, limit, priority);
  }

  @Post('support/:id/assign-self')
  @ApiOperation({ summary: 'Self-assign support ticket' })
  @ApiResponse({ status: 200, description: 'Support ticket assigned successfully' })
  assignTicketToSelf(
    @Param('id') ticketId: string,
    @CurrentUser('id') staffId: string,
  ) {
    return this.staffService.assignTicketToSelf(ticketId, staffId);
  }

  // Order Management
  @Get('orders/pending')
  @ApiOperation({ summary: 'Get pending orders' })
  @ApiResponse({ status: 200, description: 'Pending orders retrieved successfully' })
  getPendingOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.staffService.getPendingOrders(page, limit);
  }

  @Put('orders/:id/process')
  @ApiOperation({ summary: 'Process order' })
  @ApiResponse({ status: 200, description: 'Order processed successfully' })
  processOrder(
    @Param('id') orderId: string,
    @CurrentUser('id') staffId: string,
    @Body('notes') notes?: string,
  ) {
    return this.staffService.processOrder(orderId, staffId, notes);
  }

  @Put('orders/:id/ship')
  @ApiOperation({ summary: 'Mark order as shipped' })
  @ApiResponse({ status: 200, description: 'Order marked as shipped' })
  shipOrder(
    @Param('id') orderId: string,
    @CurrentUser('id') staffId: string,
    @Body() shippingData: {
      trackingNumber: string;
      carrier: string;
      notes?: string;
    },
  ) {
    return this.staffService.shipOrder(orderId, staffId, shippingData);
  }

  // Schedule Management
  @Get('schedule')
  @ApiOperation({ summary: 'Get staff schedule' })
  @ApiResponse({ status: 200, description: 'Staff schedule retrieved successfully' })
  getStaffSchedule(
    @CurrentUser('id') staffId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getStaffSchedule(staffId, startDate, endDate);
  }

  @Post('schedule/availability')
  @ApiOperation({ summary: 'Set staff availability' })
  @ApiResponse({ status: 201, description: 'Staff availability set successfully' })
  setAvailability(
    @CurrentUser('id') staffId: string,
    @Body() availabilityData: {
      date: Date;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    },
  ) {
    return this.staffService.setAvailability(staffId, availabilityData);
  }

  // Performance & Stats
  @Get('performance')
  @ApiOperation({ summary: 'Get staff performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  getPerformanceMetrics(
    @CurrentUser('id') staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.staffService.getPerformanceMetrics(staffId, startDate, endDate);
  }

  // Content Moderation
  @Get('content/flagged')
  @ApiOperation({ summary: 'Get flagged content for review' })
  @ApiResponse({ status: 200, description: 'Flagged content retrieved successfully' })
  getFlaggedContent(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: string,
  ) {
    return this.staffService.getFlaggedContent(page, limit, type);
  }

  @Put('content/:type/:id/review')
  @ApiOperation({ summary: 'Review flagged content' })
  @ApiResponse({ status: 200, description: 'Content reviewed successfully' })
  reviewContent(
    @Param('type') type: string,
    @Param('id') contentId: string,
    @CurrentUser('id') staffId: string,
    @Body() reviewData: {
      action: 'approve' | 'reject' | 'remove';
      reason?: string;
      notes?: string;
    },
  ) {
    return this.staffService.reviewContent(type, contentId, staffId, reviewData);
  }
}