import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { JwtStrategey } from './strategy/jwt-startegy';
// import { JwtGuard } from './guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EmailGuard } from './guards/email.guard';
import { TokenGuard } from './guards/token.guard';
import { UserIdGuard } from './guards/userId.guard';

@Module({
  providers: [AuthService, JwtStrategey,EmailGuard,TokenGuard,UserIdGuard],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.AUTH_SECRET || 'JWT_SECRET',
      signOptions: {
        expiresIn: '7d',
      },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
