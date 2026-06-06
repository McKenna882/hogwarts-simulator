import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;
}
