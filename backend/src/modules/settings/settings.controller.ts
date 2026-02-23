import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateBusinessHoursDto } from './dto/update-business-hours.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSettings(@Body() updateSettingDto: UpdateSettingDto) {
    return this.settingsService.updateSettings(updateSettingDto);
  }

  @Get('business-hours')
  @UseGuards(AuthGuard('jwt'))
  async getBusinessHours() {
    return this.settingsService.getBusinessHours();
  }

  @Put('business-hours')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateBusinessHours(@Body() updateBusinessHoursDto: UpdateBusinessHoursDto) {
    return this.settingsService.updateBusinessHours(updateBusinessHoursDto);
  }
}
