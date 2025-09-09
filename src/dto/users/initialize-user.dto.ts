import { IsEmail, IsString } from 'class-validator';
export class InitializeUserDto {
  @IsString()
  @IsEmail()
  email: string;
}
