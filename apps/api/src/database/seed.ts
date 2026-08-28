import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { Asset } from '../modules/assets/entities/asset.entity';
import { TicketHistory } from '../modules/history/entities/ticket-history.entity';
import { TicketHistoryAction } from '../modules/history/enums/ticket-history-action.enum';
import { Location } from '../modules/locations/entities/location.entity';
import { AssignmentHistory } from '../modules/tickets/entities/assignment-history.entity';
import { FreezeRequest } from '../modules/tickets/entities/freeze-request.entity';
import { ImpactAssessment } from '../modules/tickets/entities/impact-assessment.entity';
import { Maintenance } from '../modules/tickets/entities/maintenance.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { AssignmentReleaseReason } from '../modules/tickets/enums/assignment-release-reason.enum';
import { EquipmentStopped } from '../modules/tickets/enums/equipment-stopped.enum';
import { FreezeReasonType } from '../modules/tickets/enums/freeze-reason-type.enum';
import { FreezeRequestStatus } from '../modules/tickets/enums/freeze-request-status.enum';
import { ProductionImpact } from '../modules/tickets/enums/production-impact.enum';
import { TicketPriority } from '../modules/tickets/enums/ticket-priority.enum';
import { TicketStatus } from '../modules/tickets/enums/ticket-status.enum';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../modules/users/enums/user-role.enum';

const locations = [
  ['LXN-ENV', 'Planta 1 · Línea de envasado'],
  ['LXN-ENS', 'Planta 1 · Área de ensamble'],
  ['LXN-MEC', 'Planta 2 · Taller mecánico'],
  ['LXN-UTL', 'Planta 2 · Sala de utilidades'],
  ['LXN-BOD', 'Bodega · Recepción de materiales'],
] as const;
const assets = [
  [
    'LXN-ENV-PRN-004',
    'Prensa hidráulica 4',
    'HidroPress',
    'HP-400',
    'HP4-2024-7815',
    'Prensa hidráulica',
    'LXN-ENV',
  ],
  [
    'LXN-ENV-ETQ-002',
    'Etiquetadora automática 2',
    'LabelPro',
    'LP-220',
    'LP2-2023-4390',
    'Etiquetadora',
    'LXN-ENV',
  ],
  [
    'LXN-ENV-ENV-006',
    'Envasadora vertical 6',
    'PackLine',
    'PV-600',
    'PV6-2025-0642',
    'Envasadora',
    'LXN-ENV',
  ],
  [
    'LXN-ENS-CNV-001',
    'Transportador de rodillos 1',
    'MecaFlow',
    'MF-R800',
    'MFR8-2022-1186',
    'Transportador',
    'LXN-ENS',
  ],
  [
    'LXN-ENS-TOR-003',
    'Torno CNC 3',
    'TecnoMaq',
    'TM-CNC450',
    'TMC3-2020-2917',
    'Torno CNC',
    'LXN-ENS',
  ],
  [
    'LXN-MEC-FRE-002',
    'Fresadora universal 2',
    'MetalPro',
    'MU-320',
    'MU2-2021-4620',
    'Fresadora',
    'LXN-MEC',
  ],
  [
    'LXN-MEC-SLD-001',
    'Soldadora MIG 1',
    'ArcMaster',
    'AM-350',
    'AM1-2023-1844',
    'Soldadora',
    'LXN-MEC',
  ],
  [
    'LXN-UTL-CMP-002',
    'Compresor de aire 2',
    'AirForce',
    'AF-75',
    'AF2-2022-9031',
    'Compresor',
    'LXN-UTL',
  ],
  [
    'LXN-UTL-BMB-004',
    'Bomba centrífuga 4',
    'FlowTech',
    'FC-90',
    'FC4-2024-7730',
    'Bomba',
    'LXN-UTL',
  ],
  [
    'LXN-BOD-BAL-001',
    'Balanza industrial 1',
    'PesoMax',
    'PM-1500',
    'PM15-2021-6704',
    'Balanza industrial',
    'LXN-BOD',
  ],
] as const;
const at = (days: number, hour = 9) =>
  new Date(Date.UTC(2026, 7, 28 - days, hour));

async function seed(): Promise<void> {
  if (!['development', 'test'].includes(process.env.NODE_ENV ?? 'development'))
    throw new Error(
      'The demo seed can only run in development or test environments',
    );
  const password = process.env.SEED_DEFAULT_PASSWORD;
  if (!password)
    throw new Error(
      'Missing required environment variable: SEED_DEFAULT_PASSWORD',
    );
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      await manager.query(
        'TRUNCATE TABLE ticket_evidences, ticket_histories, assignment_histories, freeze_requests, maintenances, impact_assessments, tickets, assets, locations, users RESTART IDENTITY CASCADE',
      );
      const passwordHash = await bcrypt.hash(password, 12);
      const users = await manager
        .getRepository(User)
        .save([
          {
            name: 'Valentina Morales',
            email: 'solicitante@luxnova.demo',
            role: UserRole.REQUESTER,
            passwordHash,
          },
          {
            name: 'Ana González',
            email: 'administrador@luxnova.demo',
            role: UserRole.ADMIN,
            passwordHash,
          },
          ...[
            'Camila Soto',
            'Diego Pérez',
            'Javiera Fuentes',
            'Nicolás Herrera',
            'Paula Rivas',
          ].map((name, index) => ({
            name,
            email: `tecnico.${index + 1}@luxnova.demo`,
            role: UserRole.TECHNICIAN,
            passwordHash,
          })),
        ]);
      const [requester, admin, ...technicians] = users;
      const savedLocations = await manager
        .getRepository(Location)
        .save(locations.map(([code, name]) => ({ code, name })));
      const locationIds = new Map(
        savedLocations.map((location) => [location.code, location.id]),
      );
      const machines = await manager
        .getRepository(Asset)
        .save(
          assets.map(
            ([
              assetCode,
              name,
              brand,
              model,
              serialNumber,
              category,
              locationCode,
            ]) => ({
              assetCode,
              name,
              brand,
              model,
              serialNumber,
              category,
              locationId: locationIds.get(locationCode)!,
              active: true,
            }),
          ),
        );
      const cases = [
        [
          'Vibración anormal en el sistema hidráulico.',
          TicketPriority.LOW,
          TicketStatus.NEW,
          null,
        ],
        [
          'La etiquetadora pierde sincronización al iniciar el turno.',
          TicketPriority.HIGH,
          TicketStatus.ASSIGNED,
          technicians[0].id,
        ],
        [
          'Envasadora detenida por alarma de seguridad.',
          TicketPriority.CRITICAL,
          TicketStatus.IN_PROGRESS,
          technicians[1].id,
        ],
        [
          'Rodillos con desgaste y ruido intermitente.',
          TicketPriority.MEDIUM,
          TicketStatus.FREEZE_REQUESTED,
          technicians[2].id,
        ],
        [
          'Torno detenido: se espera repuesto para el husillo.',
          TicketPriority.HIGH,
          TicketStatus.FROZEN,
          null,
        ],
        [
          'Fresadora requiere nuevo técnico tras resolver bloqueo.',
          TicketPriority.MEDIUM,
          TicketStatus.PENDING_REASSIGNMENT,
          null,
        ],
        [
          'Soldadora reparada, pendiente de cierre administrativo.',
          TicketPriority.HIGH,
          TicketStatus.RESOLVED,
          null,
        ],
        [
          'Compresor corregido y cerrado como referencia histórica.',
          TicketPriority.MEDIUM,
          TicketStatus.CLOSED,
          null,
        ],
        [
          'Bomba con fuga visible que afecta el área de utilidades.',
          TicketPriority.CRITICAL,
          TicketStatus.NEW,
          null,
        ],
      ] as const;
      const tickets = await manager
        .getRepository(Ticket)
        .save(
          cases.map(
            ([description, priority, status, currentTechnicianId], index) => ({
              description,
              priority,
              status,
              assetId: machines[index].id,
              requesterId: requester.id,
              currentTechnicianId,
              resolvedById:
                status === TicketStatus.RESOLVED
                  ? technicians[3].id
                  : status === TicketStatus.CLOSED
                    ? technicians[4].id
                    : null,
              closedById: status === TicketStatus.CLOSED ? admin.id : null,
              resolvedAt:
                status === TicketStatus.RESOLVED
                  ? at(1, 16)
                  : status === TicketStatus.CLOSED
                    ? at(10, 15)
                    : null,
              closedAt: status === TicketStatus.CLOSED ? at(9, 10) : null,
              createdAt: at(index + 1),
              updatedAt: at(0, 12),
            }),
          ),
        );
      await manager
        .getRepository(ImpactAssessment)
        .save(
          tickets.map((ticket, index) => ({
            ticketId: ticket.id,
            safetyRisk: index === 2 || index === 8,
            equipmentStopped:
              index === 1 || index === 4 || index === 6
                ? EquipmentStopped.YES
                : index === 0
                  ? EquipmentStopped.NO
                  : EquipmentStopped.PARTIAL,
            productionImpact:
              index === 2 || index === 4
                ? ProductionImpact.STOPPED
                : index === 0
                  ? ProductionImpact.NONE
                  : ProductionImpact.REDUCED,
            workaroundAvailable:
              index === 0 || index === 3 || index === 5 || index === 7,
            affectsOtherAreas: index === 2 || index === 8,
            calculatedPriority: ticket.priority,
          })),
        );
      const assignment = (
        ticketIndex: number,
        techIndex: number,
        releasedAt: Date | null,
        reason: AssignmentReleaseReason | null,
      ) => ({
        ticketId: tickets[ticketIndex].id,
        technicianId: technicians[techIndex].id,
        assignedById: admin.id,
        assignedAt: at(ticketIndex + 2, 10),
        startedAt: ticketIndex === 1 ? null : at(ticketIndex + 2, 11),
        releasedAt,
        releaseReason: reason,
      });
      await manager
        .getRepository(AssignmentHistory)
        .save([
          assignment(1, 0, null, null),
          assignment(2, 1, null, null),
          assignment(3, 2, null, null),
          assignment(4, 3, at(5, 12), AssignmentReleaseReason.FREEZE_APPROVED),
          assignment(5, 4, at(6, 12), AssignmentReleaseReason.FREEZE_APPROVED),
          assignment(6, 3, at(1, 16), AssignmentReleaseReason.RESOLVED),
          assignment(7, 4, at(10, 15), AssignmentReleaseReason.RESOLVED),
        ]);
      await manager.getRepository(Maintenance).save([
        {
          ticketId: tickets[2].id,
          diagnosis: 'Sensor de seguridad desalineado.',
          workPerformed: 'Revisión y ajuste en curso.',
          notes: 'Detener la línea hasta validar la prueba.',
          finalEvidenceUrl: null,
        },
        {
          ticketId: tickets[6].id,
          diagnosis: 'Conector MIG fatigado.',
          workPerformed:
            'Se reemplazó el conector y se realizó prueba de arco.',
          notes: 'Pendiente de cierre administrativo.',
          finalEvidenceUrl: null,
        },
        {
          ticketId: tickets[7].id,
          diagnosis: 'Filtro de admisión saturado.',
          workPerformed: 'Filtro reemplazado y presión normalizada.',
          notes: 'Caso histórico sin evidencia visual.',
          finalEvidenceUrl: null,
        },
      ]);
      await manager.getRepository(FreezeRequest).save([
        {
          ticketId: tickets[3].id,
          technicianId: technicians[2].id,
          reasonType: FreezeReasonType.SPECIALIST_UNAVAILABLE,
          reasonDetail: null,
          status: FreezeRequestStatus.PENDING,
          requestedAt: at(0, 11),
          reviewedById: null,
          reviewedAt: null,
          reviewNote: null,
        },
        {
          ticketId: tickets[4].id,
          technicianId: technicians[3].id,
          reasonType: FreezeReasonType.SPARE_PART_UNAVAILABLE,
          reasonDetail: null,
          status: FreezeRequestStatus.APPROVED,
          requestedAt: at(5, 10),
          reviewedById: admin.id,
          reviewedAt: at(5, 12),
          reviewNote: 'Repuesto crítico en tránsito.',
        },
        {
          ticketId: tickets[5].id,
          technicianId: technicians[4].id,
          reasonType: FreezeReasonType.OTHER,
          reasonDetail: 'Área restringida por inspección externa.',
          status: FreezeRequestStatus.APPROVED,
          requestedAt: at(6, 10),
          reviewedById: admin.id,
          reviewedAt: at(6, 12),
          reviewNote: 'Bloqueo resuelto; requiere reasignación.',
        },
        {
          ticketId: tickets[2].id,
          technicianId: technicians[1].id,
          reasonType: FreezeReasonType.AWAITING_AUTHORIZATION,
          reasonDetail: null,
          status: FreezeRequestStatus.REJECTED,
          requestedAt: at(1, 10),
          reviewedById: admin.id,
          reviewedAt: at(1, 11),
          reviewNote: 'Autorización disponible; continuar mantención.',
        },
      ]);
      await manager
        .getRepository(TicketHistory)
        .save(
          tickets.map((ticket, index) => ({
            ticketId: ticket.id,
            actorId: requester.id,
            action: TicketHistoryAction.TICKET_CREATED,
            previousStatus: null,
            newStatus: TicketStatus.NEW,
            previousPriority: null,
            newPriority: ticket.priority,
            details: { seeded: true },
            createdAt: at(index + 2, 8),
          })),
        );
    });
  } finally {
    await dataSource.destroy();
  }
}
seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
