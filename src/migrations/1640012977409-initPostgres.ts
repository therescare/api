import type { MigrationInterface, QueryRunner } from 'typeorm';

export class initPostgres1640012977409 implements MigrationInterface {
	name = 'initPostgres1640012977409';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
		await queryRunner.query(
			`CREATE TABLE "pending_verification" ("id" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "UQ_c7f6f11ee662e6674c48c1d8cae" UNIQUE ("email"), CONSTRAINT "PK_09c0bd8ad0770d9e05f5e5541fd" PRIMARY KEY ("id"))`
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "moniker" character varying NOT NULL, "canChangeMonikerAfter" TIMESTAMP NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP TABLE "pending_verification"`);
		await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
	}
}
