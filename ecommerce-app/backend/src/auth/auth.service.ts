import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.customerRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const customer = this.customerRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name,
      phone: dto.phone ?? null,
      isVerified: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    });

    const savedCustomer = await this.customerRepository.save(customer);
    const tokens = await this.issueTokenPair(savedCustomer);

    this.logger.log(`Customer registered: ${savedCustomer.email}`);

    this.emailService.sendWelcomeEmail(savedCustomer).catch((error: unknown) => {
      this.logger.warn(
        `Welcome email failed for ${savedCustomer.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    });

    return {
      customer: this.safeCustomer(savedCustomer),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const customer = await this.customerRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!customer) {
      this.logger.warn(`Login failed for unknown email: ${dto.email.toLowerCase()}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (customer.lockedUntil && customer.lockedUntil.getTime() > Date.now()) {
      this.logger.warn(`Login blocked for locked account: ${customer.email}`);
      throw new HttpException('Account is temporarily locked', HttpStatus.TOO_MANY_REQUESTS);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.passwordHash);

    if (!isPasswordValid) {
      customer.failedLoginAttempts += 1;

      if (customer.failedLoginAttempts >= 5) {
        customer.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.customerRepository.save(customer);
      this.logger.warn(`Login failed for customer: ${customer.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    customer.failedLoginAttempts = 0;
    customer.lockedUntil = null;
    await this.customerRepository.save(customer);

    const tokens = await this.issueTokenPair(customer);

    this.logger.log(`Login success for customer: ${customer.email}`);

    return {
      customer: this.safeCustomer(customer),
      tokens,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { success: true };
    }

    const tokenEntry = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!tokenEntry) {
      return { success: true };
    }

    tokenEntry.isRevoked = true;
    await this.refreshTokenRepository.save(tokenEntry);
    this.logger.log(`Refresh token revoked for customer: ${tokenEntry.customerId}`);

    return { success: true };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? 'dev-refresh-secret';

    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenEntry = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
      },
    });

    if (!tokenEntry || tokenEntry.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }

    const customer = await this.customerRepository.findOne({
      where: { id: payload.sub },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    tokenEntry.isRevoked = true;
    await this.refreshTokenRepository.save(tokenEntry);

    const tokens = await this.issueTokenPair(customer);

    this.logger.log(`Session refreshed for customer: ${customer.email}`);

    return {
      customer: this.safeCustomer(customer),
      tokens,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const customer = await this.customerRepository.findOne({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (!customer) {
      return {
        message: 'If this email exists, a password reset link has been sent.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    customer.passwordResetTokenHash = tokenHash;
    customer.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.customerRepository.save(customer);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    this.emailService
      .sendPasswordReset(customer, resetLink)
      .catch((error: unknown) => {
        this.logger.warn(
          `Password reset email failed for ${customer.email}`,
          error instanceof Error ? error.stack : undefined,
        );
      });

    return {
      message: 'Password reset instructions have been sent.',
      resetToken: token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.password_reset_token_hash = :tokenHash', { tokenHash })
      .andWhere('customer.password_reset_expires_at > NOW()')
      .getOne();

    if (!customer) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    customer.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    customer.passwordResetTokenHash = null;
    customer.passwordResetExpiresAt = null;
    customer.failedLoginAttempts = 0;
    customer.lockedUntil = null;

    await this.customerRepository.save(customer);

    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ isRevoked: true })
      .where('customer_id = :customerId', { customerId: customer.id })
      .execute();

    this.logger.log(`Password reset completed for customer: ${customer.email}`);

    return {
      message: 'Password reset successful',
    };
  }

  async getProfile(customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.safeCustomer(customer);
  }

  private async issueTokenPair(customer: Customer): Promise<TokenPair> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret';
    const refreshTokenSecret =
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ?? 'dev-refresh-secret';

    const accessExpiry = this.configService.get<string>('JWT_EXPIRY') ?? '15m';
    const refreshExpiry = this.configService.get<string>('REFRESH_TOKEN_EXPIRY') ?? '30d';
    const accessExpirySeconds = this.parseDurationToSeconds(accessExpiry, 15 * 60);
    const refreshExpirySeconds = this.parseDurationToSeconds(refreshExpiry, 30 * 24 * 60 * 60);

    const payload = {
      sub: customer.id,
      email: customer.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: accessExpirySeconds,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
        type: 'refresh',
      },
      {
        secret: refreshTokenSecret,
        expiresIn: refreshExpirySeconds,
      },
    );

    const refreshTokenRecord = this.refreshTokenRepository.create({
      token: refreshToken,
      customerId: customer.id,
      expiresAt: new Date(Date.now() + refreshExpirySeconds * 1000),
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshTokenRecord);

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseDurationToSeconds(duration: string, fallbackSeconds: number): number {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return fallbackSeconds;
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return fallbackSeconds;
    }
  }

  private safeCustomer(customer: Customer) {
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
    };
  }
}
