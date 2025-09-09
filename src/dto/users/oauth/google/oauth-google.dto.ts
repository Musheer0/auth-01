import { IsString, IsOptional } from 'class-validator';

export class OAuthGoogleQueryParamsDto {
  @IsString()
  code: string;

  @IsString()
  scope: string;

  @IsString()
  authuser: string;

  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  state?: string;
}
