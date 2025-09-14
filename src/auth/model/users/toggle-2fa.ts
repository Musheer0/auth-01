import {  PrismaClient} from "@prisma/client";
import argon2 from "argon2";
import { Toggle2faDto } from "src/dto/users/toggle-2fa.dto";

export const Toggle2fa=async(prisma:PrismaClient, userId:string,state:boolean)=>{
    // Step 1: Fetch user by email
  const user = await prisma.user.findUnique({
    where: { id:userId },
  });

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  // Step 2: Check provider and password existence
  if (user.provider !== 'CREDENTIALS') {
    return { error: 'User must login with their provider' };
  }

  if (!user.password) {
    return { error: 'User has no password set' };
  }

  // Step 3: Check if verified and not banned
  if (!user.is_verified) {
    return { error: 'User is not verified' };
  }

  if (user.is_banned) {
    return { error: 'User is banned' };
  }

    if(!state){
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { twofa_enabled: false, twofa_enabled_at: null },
          });
          return { user: updatedUser }; 
    }
    else{
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { twofa_enabled: true, twofa_enabled_at: new Date() },
          });
          return { user: updatedUser }; 
    }
}