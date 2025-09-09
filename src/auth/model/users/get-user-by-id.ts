import { PrismaClient, User } from "@prisma/client";
/**
 * Get user by id
 * @param prisma Prisma client
 * @param id string get the user id
 */
export const GetUserById = async(prisma:PrismaClient,id:string)=>{
    const cache:User|null = null
    if(cache) return cache
    return await prisma.user.findUnique({
        where:{id}
    })
}