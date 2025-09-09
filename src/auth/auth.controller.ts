import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeUserDto } from 'src/dto/users/initialize-user.dto';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { GetClientMetadata } from 'src/decorators/get-client-metadata';
import { TclientMetadata } from 'src/types/client-metadata';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService:AuthService
    ){}
    @Post('/sign-up/verify-email')
    async SignUpUser(@Body() body:InitializeUserDto){
        return this.authService.IntializeUser(body.email)
    }
    @Post('/sign-up')
    async SignUpVerifyUser(@Body() body:VerifyCreateUserDto ,@GetClientMetadata() metadata:TclientMetadata, @Res() res:Response){
        const response = await this.authService.VerifyCreateUser(body,metadata)
        return response
    }
}
