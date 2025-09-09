import { IsString } from 'class-validator';
export class PasswordResetDto {
  @IsString()
  token_id: string;
  @IsString()
  otp: string;
  @IsString()
  password: string;
}
