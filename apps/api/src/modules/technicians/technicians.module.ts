import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { TechniciansController } from './technicians.controller';
import { TechniciansService } from './technicians.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [TechniciansController],
  providers: [TechniciansService],
})
export class TechniciansModule {}
