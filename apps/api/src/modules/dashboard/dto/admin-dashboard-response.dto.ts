import { ApiProperty } from '@nestjs/swagger';

export class AdminDashboardTicketsResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() new!: number;
  @ApiProperty() critical!: number;
  @ApiProperty() inProgress!: number;
  @ApiProperty() frozen!: number;
}

export class AdminDashboardTechniciansResponseDto {
  @ApiProperty() total!: number;
  @ApiProperty() available!: number;
  @ApiProperty() busy!: number;
}

export class AdminDashboardRequiresAttentionResponseDto {
  @ApiProperty() pendingAssignment!: number;
  @ApiProperty() pendingFreezeApproval!: number;
  @ApiProperty() pendingReassignment!: number;
  @ApiProperty() pendingClosure!: number;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: () => AdminDashboardTicketsResponseDto })
  tickets!: AdminDashboardTicketsResponseDto;

  @ApiProperty({ type: () => AdminDashboardTechniciansResponseDto })
  technicians!: AdminDashboardTechniciansResponseDto;

  @ApiProperty({ type: () => AdminDashboardRequiresAttentionResponseDto })
  requiresAttention!: AdminDashboardRequiresAttentionResponseDto;
}
