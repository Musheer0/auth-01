import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInitialUser } from './model/users/create-initial-user';
import { VerifyToken } from './model/verification-tokens/verify-token';
import { $Enums } from '@prisma/client';
import { VerifyCreateUserDto } from 'src/dto/users/verify-create-user-dto';
import { CreateCrendentialsUser } from './model/users/create-crendentials-user';
import { TclientMetadata } from 'src/types/client-metadata';
import { CreateSession } from './model/sessions/create-session';

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
     async VerifyUser(data:VerifyCreateUserDto,metadata:TclientMetadata){
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
        const session = await CreateSession(new_user.id,this.prisma,metadata.ip,metadata.userAgent,metadata.os)
        return session
        } catch (error) {
            console.error('[create credentials user error]',error)
            throw new InternalServerErrorException()
        }
        }
        throw new InternalServerErrorException()
    }
   
}
