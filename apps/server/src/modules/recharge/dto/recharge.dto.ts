import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRechargeOrderDto {
  @IsString()
  @IsNotEmpty()
  packageId!: string;
}

export class VirtualPayDto {
  @IsString()
  @IsNotEmpty()
  key!: string;
}
