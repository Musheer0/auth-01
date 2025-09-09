import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const GetClientMetadata = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest();

    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress;

    const userAgent = req.headers['user-agent'] || '';

    let os = 'Unknown OS';
    if (/windows nt 10/i.test(userAgent)) os = 'Windows 10';
    else if (/windows nt 11/i.test(userAgent)) os = 'Windows 11';
    else if (/windows nt 6\.3/i.test(userAgent)) os = 'Windows 8.1';
    else if (/windows nt 6\.2/i.test(userAgent)) os = 'Windows 8';
    else if (/windows nt 6\.1/i.test(userAgent)) os = 'Windows 7';
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    return {
      ip,
      userAgent,
      os,
      isWeb: !!req.headers['x-web'],
    };
  },
);
