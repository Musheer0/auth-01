import { PrismaClient, User } from "@prisma/client";
import { GetUserByEmail } from "./get-user-by-email";
import { SendEmail } from "src/libs/send-email";
import { GenerateOtp } from "src/libs/generate-otp";
import { createEmailVerificationToken } from "../verification-tokens/create-email-verification-token";
import { generateOtpEmail } from "src/templates/email/otp-template";
/**
 * Initialize a new User
 * @param prisma Prisma Email
 * @param email string new user emial
 */
export const CreateInitialUser = async(prisma:PrismaClient,email:string)=>{
    try {
       const exiting_user = await GetUserByEmail(prisma,email);
       if(exiting_user) return {error:'email already taken'}
       try {
        const new_user = await prisma.user.create({
        data:{
            name: 'auth01',
            primary_email:email,
        }
       });
       console.log(new_user)
       try {
        const otp =await GenerateOtp()
        const html_template = generateOtpEmail({title:'Verifiy your email',
            desc:`
            Use the one-time password (OTP) below to verify your email address.
             For security reasons, this code will expire in 15 minutes and can only be used once
            `,
            email:new_user.primary_email,
            otp})
        const email_verificatio_token =await createEmailVerificationToken(new_user.id,otp,prisma)
        await SendEmail(html_template,new_user.primary_email,'Verifiy your email');
        return {verify_token:email_verificatio_token.tokenId,expiresAt:email_verificatio_token.expiresAt}
       } catch (error) {
        await prisma.user.delete({where:new_user});
        console.error(`[email sending error ]`,error)
        return {error:'error sending otp try again'}
       }
     
       } catch (error) {
          console.error(`[prisma create user error ]`,error)
        return {error:'internal server error'}
       }
    } catch (error) {
        console.error(`[create user error ]`,error)
        return {error:'internal server error'}
    }
}