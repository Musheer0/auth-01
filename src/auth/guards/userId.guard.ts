import {  Injectable, UnauthorizedException } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Request } from "express";

@Injectable()
export class UserIdGuard extends ThrottlerGuard{
    protected getTracker(req:any):Promise<string>{
        if(req.body && req.user){
            return req.user?.user_id;
        }
       throw new UnauthorizedException()
    }
     protected getLimit(): number {
    return 10;
  }
  
  protected getTtl(): number {
    return 60000*10;
  }
}
