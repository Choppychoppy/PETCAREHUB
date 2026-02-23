import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Pets')
@Controller('pets')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new pet' })
  @ApiResponse({ status: 201, description: 'Pet created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createPetDto: CreatePetDto,
  ) {
    return this.petsService.create(userId, createPetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pets for current user' })
  @ApiResponse({ status: 200, description: 'Pets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser('id') userId: string) {
    return this.petsService.findAllByUser(userId);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all pets for admin (Admin/Staff only)' })
  @ApiResponse({ status: 200, description: 'Pets retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
  findAllForAdmin(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.petsService.findAllForAdmin(page, limit);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get pet statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.petsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet by ID' })
  @ApiResponse({ status: 200, description: 'Pet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your pet' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.petsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update pet' })
  @ApiResponse({ status: 200, description: 'Pet updated successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your pet' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updatePetDto: UpdatePetDto,
  ) {
    return this.petsService.update(id, userId, updatePetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete pet' })
  @ApiResponse({ status: 200, description: 'Pet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your pet' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.petsService.remove(id, userId);
    return { message: 'Pet deleted successfully' };
  }

  // Medical History Endpoints
  @Post(':id/medical-history')
  @ApiOperation({ summary: 'Add medical record to pet' })
  @ApiResponse({ status: 201, description: 'Medical record added successfully' })
  addMedicalRecord(
    @Param('id') petId: string,
    @CurrentUser('id') userId: string,
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
  ) {
    return this.petsService.addMedicalRecord(petId, userId, createMedicalRecordDto);
  }

  @Get(':id/medical-history')
  @ApiOperation({ summary: 'Get pet medical history' })
  @ApiResponse({ status: 200, description: 'Medical history retrieved successfully' })
  getMedicalHistory(
    @Param('id') petId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.petsService.getMedicalHistory(petId, userId);
  }

  @Put(':id/medical-history/:recordId')
  @ApiOperation({ summary: 'Update medical record' })
  @ApiResponse({ status: 200, description: 'Medical record updated successfully' })
  updateMedicalRecord(
    @Param('id') petId: string,
    @Param('recordId') recordId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: Partial<CreateMedicalRecordDto>,
  ) {
    return this.petsService.updateMedicalRecord(recordId, petId, userId, updateData);
  }

  @Delete(':id/medical-history/:recordId')
  @ApiOperation({ summary: 'Delete medical record' })
  @ApiResponse({ status: 200, description: 'Medical record deleted successfully' })
  async deleteMedicalRecord(
    @Param('id') petId: string,
    @Param('recordId') recordId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.petsService.deleteMedicalRecord(recordId, petId, userId);
    return { message: 'Medical record deleted successfully' };
  }
}