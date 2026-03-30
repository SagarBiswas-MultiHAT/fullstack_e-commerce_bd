import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private totpSecret: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPasswordHash = this.configService.get<string>('ADMIN_PASSWORD_HASH');

    if (!adminEmail || !adminPasswordHash) {
      throw new UnauthorizedException('Admin credentials are not configured');
    }

    if (dto.email.toLowerCase() !== adminEmail.toLowerCase()) {
      this.logger.warn(`Admin login failed for unknown email: ${dto.email.toLowerCase()}`);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, adminPasswordHash);
    if (!passwordValid) {
      this.logger.warn(`Admin login failed for configured email: ${adminEmail.toLowerCase()}`);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!this.totpSecret) {
      this.totpSecret = generateSecret();
      const appName = this.configService.get<string>('APP_NAME') ?? 'TopClass Ecommerce';
      const qrCodeUrl = generateURI({
        issuer: appName,
        label: adminEmail,
        secret: this.totpSecret,
      });

      return {
        requiresTwoFactorSetup: true,
        qrCodeUrl,
      };
    }

    if (!dto.totpCode) {
      this.logger.warn(`Admin login rejected (missing TOTP): ${adminEmail.toLowerCase()}`);
      throw new UnauthorizedException('TOTP code is required');
    }

    const verification = await verify({
      token: dto.totpCode,
      secret: this.totpSecret,
    });

    if (!verification.valid) {
      this.logger.warn(`Admin login failed (invalid TOTP): ${adminEmail.toLowerCase()}`);
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: adminEmail,
        role: 'admin',
      },
      {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
        expiresIn: 15 * 60,
      },
    );

    return {
      requiresTwoFactorSetup: false,
      accessToken,
    };
  }

  me(user: Record<string, unknown>) {
    return {
      email: (user.sub as string | undefined) ?? null,
      role: (user.role as string | undefined) ?? 'admin',
    };
  }
}
