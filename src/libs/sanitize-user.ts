import { User } from "@prisma/client";

export const SanitizeUser = (user:User)=>{
 const { password, verified_at, banned_at, is_banned, ...safeUser } =
          user;
          return safeUser
}