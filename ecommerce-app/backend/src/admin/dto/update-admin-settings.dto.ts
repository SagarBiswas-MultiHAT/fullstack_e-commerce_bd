import { IsEmail, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateAdminSettingsDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  brandColor?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsOptional()
  @IsString()
  contactInfo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  lowStockAlertThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(10080)
  abandonedCartDelayMinutes?: number;
}
