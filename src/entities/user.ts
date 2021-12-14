import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	email: string;
	@Column()
	passwordHash: string;

	@Column()
	moniker: string;
	@Column()
	canChangeMonikerAfter: Date;
}
