import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate{
    canActivate(ctx:ExecutionContext){
        const req:Request = ctx.switchToHttp().getRequest();
        const cookie= req.cookies['session'] ||req.headers['authorization']?.split('Bearer ')[1];
        if(!cookie) return false;
        return true
    }
}