import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity({ name: 'assets' })
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_assets_asset_code', { unique: true })
  @Column({ name: 'asset_code', type: 'varchar', length: 64, unique: true })
  assetCode!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  brand!: string;

  @Column({ type: 'varchar', length: 120 })
  model!: string;

  @Index('uq_assets_serial_number', { unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 120, unique: true })
  serialNumber!: string;

  @Column({ type: 'varchar', length: 120 })
  category!: string;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Location, (location) => location.assets, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'location_id' })
  location!: Location;

  @OneToMany(() => Ticket, (ticket) => ticket.machine)
  tickets!: Ticket[];
}
