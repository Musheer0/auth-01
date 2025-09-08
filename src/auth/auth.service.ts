import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInitialUser } from './model/users/create-initial-user';
import { VerifyToken } from './model/verification-tokens/verify-token';
import { $Enums } from '@prisma/client';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { CreateCrendentialsUser } from './model/users/create-crendentials-user';

@Injectable()
export class AuthService {
    constructor(
        private prisma:PrismaService
    ){
    }
      async  IntializeUser (email:string){
        const initialized_user = await CreateInitialUser(this.prisma,email)
        if(initialized_user.error){
            if(initialized_user.error.includes('internal server')){
            throw new InternalServerErrorException()    
            }
            throw new BadRequestException(initialized_user.error)
        }
        return initialized_user
        }
     async VerifyUser(data:VerifyCreateUserDto){
        const token = await VerifyToken($Enums.VerificationTokenScope.EMAIL_VERIFY,data.token_id,data.otp,this.prisma)
          if(token.error){
            if(token.error.includes('internal server')){
            throw new InternalServerErrorException()    
            }
            throw new BadRequestException(token.error)
        }
        if(token.userid){
        try {
        const new_user = await CreateCrendentialsUser(this.prisma,token.userid,data.name,data.password)
        return {
            name:new_user.name,
            email:new_user.primary_email,
            image_url:new_user.image_url
        }
        } catch (error) {
            console.error('[create credentials user error]',error)
            throw new InternalServerErrorException()
        }
        }
        throw new InternalServerErrorException()
    }
   
}
