import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(180)
  slug!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
