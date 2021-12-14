import { Entity, BaseEntity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class PendingVerification extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column({ unique: true })
    email: string;
}