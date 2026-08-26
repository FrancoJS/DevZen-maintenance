import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { readJwtConfiguration, toJwtModuleOptions } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        toJwtModuleOptions(
          readJwtConfiguration({
            JWT_SECRET: configService.get<string>('JWT_SECRET'),
            JWT_EXPIRES_IN_SECONDS: configService.get<string>(
              'JWT_EXPIRES_IN_SECONDS',
            ),
          }),
        ),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
