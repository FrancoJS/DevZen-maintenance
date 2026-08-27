import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechniciansModule } from '../technicians/technicians.module';
import { AssignmentHistory } from '../tickets/entities/assignment-history.entity';
import { FreezeRequest } from '../tickets/entities/freeze-request.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TechniciansModule,
    TypeOrmModule.forFeature([Ticket, FreezeRequest, AssignmentHistory]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
