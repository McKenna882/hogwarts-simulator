import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AdminWalletAdjustDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsInt()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AdminMarkRechargePaidDto {
  @IsString()
  @IsNotEmpty()
  key!: string;
}

export class AdminUpsertRechargePackageDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(0)
  amountCents!: number;

  @IsInt()
  @Min(1)
  galleons!: number;

  @IsInt()
  @Min(0)
  bonusGalleons = 0;

  @IsInt()
  sortOrder = 0;
}
