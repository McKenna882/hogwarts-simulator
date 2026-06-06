import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  password: string;
}
