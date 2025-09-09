import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategey extends PassportStrategy(Strategy){
    constructor(){
       super({
       jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req:Request)=>{
            return req.cookies['session']||null
        }
       ]),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_SECRET || 'JWT SECRET',
       })
    }

    async validate(args:any){
        return args
    }
}