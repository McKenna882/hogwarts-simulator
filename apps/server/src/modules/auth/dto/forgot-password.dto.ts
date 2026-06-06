import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: '缺少重置令牌' })
  token: string;

  @IsNotEmpty({ message: '请输入新密码' })
  @MinLength(6, { message: '密码至少需要 6 位' })
  password: string;
}
