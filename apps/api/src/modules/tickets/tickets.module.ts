import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentHistory } from './entities/assignment-history.entity';
import { FreezeRequest } from './entities/freeze-request.entity';
import { ImpactAssessment } from './entities/impact-assessment.entity';
import { Maintenance } from './entities/maintenance.entity';
import { Ticket } from './entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      ImpactAssessment,
      Maintenance,
      FreezeRequest,
      AssignmentHistory,
    ]),
  ],
})
export class TicketsModule {}
