import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../modules/auth/auth.module';
import { HistoryModule } from '../modules/history/history.module';
import { TicketsModule } from '../modules/tickets/tickets.module';
import { UsersModule } from '../modules/users/users.module';
import { readJwtConfiguration } from '../modules/auth/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validate: (environment) => {
        readJwtConfiguration(environment);
        return environment;
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TicketsModule,
    HistoryModule,
  ],
})
export class AppModule {}
