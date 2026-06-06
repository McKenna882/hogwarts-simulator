import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少需要 6 位' })
  password: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
