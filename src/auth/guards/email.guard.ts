import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerStorage } from "@nestjs/throttler";
import { Request } from "express";

@Injectable()
export class EmailGuard extends ThrottlerGuard{
    protected getTracker(req:Request):Promise<string>{
        if(req.body && req.body.email){
            return req.body.email;
        }
       throw new BadRequestException('Email is required');
    }
     protected getLimit(): number {
    return 10;
  }
  
  protected getTtl(): number {
    return 60000*10;
  }
}
