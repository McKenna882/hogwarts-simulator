import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class BuyProductDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
