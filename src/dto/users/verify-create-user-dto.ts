import { IsString } from 'class-validator';
export class VerifyCreateUserDto {
  @IsString()
  token_id: string;
  @IsString()
  otp: string;
  @IsString()
  name: string;
  @IsString()
  password: string;
}
