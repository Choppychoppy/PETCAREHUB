import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { BusinessHour } from './entities/business-hour.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateBusinessHoursDto } from './dto/update-business-hours.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    @InjectRepository(BusinessHour)
    private businessHourRepository: Repository<BusinessHour>,
  ) {}

  async getSettings(): Promise<Setting> {
    // There should only be one settings record
    let setting = await this.settingRepository.findOne({ where: {} });

    // If no settings exist, create default
    if (!setting) {
      setting = this.settingRepository.create({
        businessName: 'PetCare Hub',
        businessEmail: 'contact@petcarehub.com',
        businessPhone: '+84 901 234 567',
        businessAddress: '123 Đường NVCND, An Khánh, Ninh Kiều, Cần Thơ',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        taxRate: 0,
        description: 'Trung tâm chăm sóc thú cưng hàng đầu',
      });
      setting = await this.settingRepository.save(setting);
    }

    return setting;
  }

  async updateSettings(updateSettingDto: UpdateSettingDto): Promise<Setting> {
    let setting = await this.settingRepository.findOne({ where: {} });

    if (!setting) {
      // Create new settings if none exist
      setting = this.settingRepository.create(updateSettingDto);
    } else {
      // Update existing settings
      Object.assign(setting, updateSettingDto);
    }

    return this.settingRepository.save(setting);
  }

  async getBusinessHours(): Promise<BusinessHour[]> {
    const hours = await this.businessHourRepository.find({
      order: { day: 'ASC' },
    });

    // If no hours exist, create default hours
    if (hours.length === 0) {
      const defaultHours = [
        { day: 'monday', openTime: '08:00', closeTime: '18:00', isClosed: false },
        { day: 'tuesday', openTime: '08:00', closeTime: '18:00', isClosed: false },
        { day: 'wednesday', openTime: '08:00', closeTime: '18:00', isClosed: false },
        { day: 'thursday', openTime: '08:00', closeTime: '18:00', isClosed: false },
        { day: 'friday', openTime: '08:00', closeTime: '18:00', isClosed: false },
        { day: 'saturday', openTime: '08:00', closeTime: '16:00', isClosed: false },
        { day: 'sunday', openTime: '09:00', closeTime: '15:00', isClosed: false },
      ];

      const createdHours = defaultHours.map(hour =>
        this.businessHourRepository.create(hour)
      );

      return this.businessHourRepository.save(createdHours);
    }

    return hours;
  }

  async updateBusinessHours(updateBusinessHoursDto: UpdateBusinessHoursDto): Promise<BusinessHour[]> {
    // Delete all existing business hours
    await this.businessHourRepository.delete({});

    // Create new business hours from the provided data
    const newHours = updateBusinessHoursDto.hours.map(hourDto =>
      this.businessHourRepository.create(hourDto)
    );

    return this.businessHourRepository.save(newHours);
  }
}
