import { PrismaClient, User } from "@prisma/client"
import { hash } from "argon2"
import { SignInUserDto } from "src/dto/users/sign-in-user.dto"
import { GenerateOtp } from "src/libs/generate-otp"
import { SendEmail } from "src/libs/send-email"
import { generateOtpEmail } from "src/templates/email/otp-template"

export const TwofaLogin = async(prisma:PrismaClient,user:User)=>{
    if(!user.twofa_enabled) return 
    const otp =await GenerateOtp()
    const secret = await hash(otp)
    const verification = await prisma.verificationToken.create({
        data:{
            identifier_id:user.id,
            scope:"TWOFA_LOGIN",
            expires_at:new Date(Date.now()+10*60*1000), // 10 minutes,
            token:secret
        }
    });
    // send email
    await SendEmail(generateOtpEmail({title:"Your OTP Code",otp,email:user.primary_email,desc:'use this code for your 2fa login'}),user.primary_email,"Your OTP Code");
    return {id:verification.id,expires_at:verification.expires_at}
}