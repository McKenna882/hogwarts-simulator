import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  wizardTitle?: string;

  @IsOptional()
  @IsString()
  house?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
