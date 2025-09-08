import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeUserDto } from 'src/dto/users/initialize-user.dto';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';

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
    async SignUpVerifyUser(@Body() body:VerifyCreateUserDto){
        return this.authService.VerifyUser(body)
    }
}
