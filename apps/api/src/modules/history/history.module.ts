import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketHistory } from './entities/ticket-history.entity';

@Module({ imports: [TypeOrmModule.forFeature([TicketHistory])] })
export class HistoryModule {}
