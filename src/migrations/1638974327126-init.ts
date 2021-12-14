import type { MigrationInterface, QueryRunner } from 'typeorm';

export class init1638974327126 implements MigrationInterface {
	name = 'init1638974327126';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "pending_verification" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL)`
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "passwordHash" varchar NOT NULL, "moniker" varchar NOT NULL)`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP TABLE "pending_verification"`);
	}
}
