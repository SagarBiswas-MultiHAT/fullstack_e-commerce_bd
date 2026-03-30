import { IsInt, Min } from 'class-validator';

export class RestockProductDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
