import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { RefreshToken } from './refresh-token.entity';
import { Review } from './review.entity';
import { Wishlist } from './wishlist.entity';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_customers_email')
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'password_reset_token_hash', type: 'varchar', length: 255, nullable: true })
  passwordResetTokenHash!: string | null;

  @Column({ name: 'password_reset_expires_at', type: 'timestamptz', nullable: true })
  passwordResetExpiresAt!: Date | null;

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];

  @OneToMany(() => Review, (review) => review.customer)
  reviews!: Review[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.customer)
  wishlists!: Wishlist[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.customer)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
