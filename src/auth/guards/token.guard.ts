import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Request } from "express";

@Injectable()
export class TokenGuard extends ThrottlerGuard{
    protected getTracker(req:Request):Promise<string>{
        if(req.body &&( req.body.token_id||req.body.token)){
            return req.body.token_id||req.body.token;
        }
       throw new BadRequestException('token id  is required');
    }
     protected getLimit(): number {
    return 10;
  }
  
  protected getTtl(): number {
    return 60000*10;
  }
}
