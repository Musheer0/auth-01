import { IsEmail, IsString } from 'class-validator';
export class PasswordResetTokenDto {
  @IsString()
  @IsEmail()
  email: string;
}
