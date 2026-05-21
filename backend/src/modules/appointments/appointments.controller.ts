import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new appointment' })
  createAppointment(
    @CurrentUser('id') userId: string,
    @Body() createAppointmentDto: any,
  ) {
    return this.appointmentsService.create(userId, createAppointmentDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get appointments (user thấy của mình, admin/staff thấy tất cả)' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('search') search?: string,
  ) {
    // Admin va Staff duoc xem toan bo lich hen, user thuong chi xem cua minh.
    const scopedUserId =
      role === UserRole.ADMIN || role === UserRole.STAFF ? undefined : userId;
    return this.appointmentsService.findAll(page, limit, status, date, search, scopedUserId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get appointment by id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    // User thuong phai dung chu so huu lich hen moi xem duoc.
    const requester =
      role === UserRole.ADMIN || role === UserRole.STAFF ? undefined : userId;
    return this.appointmentsService.findOne(id, requester);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update appointment (full update)' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: any) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Partial update appointment (status, staffId, etc.)' })
  partialUpdate(@Param('id') id: string, @Body() updateAppointmentDto: any) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel appointment (user can cancel their own)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Cannot cancel this appointment' })
  cancelAppointment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { cancellationReason?: string },
  ) {
    return this.appointmentsService.cancelByUser(id, userId, body.cancellationReason);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}