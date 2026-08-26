import 'dotenv/config';
import { DataSource } from 'typeorm';
import { TicketHistory } from '../modules/history/entities/ticket-history.entity';
import { AssignmentHistory } from '../modules/tickets/entities/assignment-history.entity';
import { FreezeRequest } from '../modules/tickets/entities/freeze-request.entity';
import { ImpactAssessment } from '../modules/tickets/entities/impact-assessment.entity';
import { Maintenance } from '../modules/tickets/entities/maintenance.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { User } from '../modules/users/entities/user.entity';
import { databaseConnectionOptions } from './database-options';

export default new DataSource({
  ...databaseConnectionOptions(process.env),
  entities: [
    User,
    Ticket,
    ImpactAssessment,
    Maintenance,
    FreezeRequest,
    AssignmentHistory,
    TicketHistory,
  ],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
