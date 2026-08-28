import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryModule } from '../history/history.module';
import { AssignmentHistory } from './entities/assignment-history.entity';
import { FreezeRequest } from './entities/freeze-request.entity';
import { ImpactAssessment } from './entities/impact-assessment.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketEvidence } from './entities/ticket-evidence.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Location } from '../locations/entities/location.entity';
import { TicketsController } from './tickets.controller';
import { FreezeRequestsController } from './freeze-requests.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    HistoryModule,
    TypeOrmModule.forFeature([
      Ticket,
      ImpactAssessment,
      Maintenance,
      FreezeRequest,
      AssignmentHistory,
      TicketEvidence,
      Asset,
      Location,
    ]),
  ],
  controllers: [TicketsController, FreezeRequestsController],
  providers: [TicketsService],
})
export class TicketsModule {}
