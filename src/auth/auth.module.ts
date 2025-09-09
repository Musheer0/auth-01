import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { JwtStrategey } from './strategy/jwt-startegy';
import { JwtGuard } from './guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [AuthService,JwtStrategey],
  imports:[PrismaModule,
     JwtModule.register({
       secret: process.env.AUTH_SECRET || 'JWT_SECRET',
        signOptions: {
          expiresIn: '7d',
        },
   }),
   PassportModule
  ],
  controllers: [AuthController]
})
export class AuthModule {}
