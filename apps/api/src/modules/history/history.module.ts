import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketHistory } from './entities/ticket-history.entity';
import { HistoryService } from './history.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketHistory])],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
