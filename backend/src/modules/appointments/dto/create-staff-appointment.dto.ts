import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  ValidateIf,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
} from 'class-validator';

/**
 * DTO cho admin/nhân viên tạo lịch hẹn cho khách hàng.
 * Hỗ trợ cả khách đã có tài khoản (registered) lẫn khách vãng lai (guest).
 */
export class CreateStaffAppointmentDto {
  @IsEnum(['registered', 'guest'])
  customerType: 'registered' | 'guest';

  // ===== Khách đã có tài khoản =====
  @ValidateIf((o) => o.customerType === 'registered')
  @IsUUID()
  @IsNotEmpty({ message: 'Vui lòng chọn khách hàng đã có tài khoản' })
  userId?: string;

  @IsOptional()
  @IsUUID()
  petId?: string;

  // Thêm thú cưng mới cho khách đã có tài khoản ngay trong luồng đặt lịch
  @IsOptional()
  @IsString()
  newPetName?: string;

  @IsOptional()
  @IsString()
  newPetSpecies?: string;

  // ===== Khách vãng lai (chưa có tài khoản) =====
  @ValidateIf((o) => o.customerType === 'guest')
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên khách hàng' })
  guestName?: string;

  @ValidateIf((o) => o.customerType === 'guest')
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại khách hàng' })
  guestPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPetName?: string;

  @IsOptional()
  @IsString()
  guestPetSpecies?: string;

  // ===== Thông tin lịch hẹn =====
  @IsUUID()
  @IsNotEmpty({ message: 'Vui lòng chọn dịch vụ' })
  serviceId: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Vui lòng chọn ngày giờ hẹn' })
  appointmentDate: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  // Nhân viên phụ trách. Admin được chọn bất kỳ nhân viên;
  // nhân viên tự tạo thì hệ thống tự gán cho chính họ (bỏ qua giá trị này).
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  // Đánh dấu lưu trữ hồ sơ online (khách vãng lai không quay lại).
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
