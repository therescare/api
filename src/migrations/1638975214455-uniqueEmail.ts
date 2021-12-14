import type { MigrationInterface, QueryRunner } from 'typeorm';

export class uniqueEmail1638975214455 implements MigrationInterface {
	name = 'uniqueEmail1638975214455';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_pending_verification" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL)`
		);
		await queryRunner.query(
			`INSERT INTO "temporary_pending_verification"("id", "email") SELECT "id", "email" FROM "pending_verification"`
		);
		await queryRunner.query(`DROP TABLE "pending_verification"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_pending_verification" RENAME TO "pending_verification"`
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_pending_verification" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, CONSTRAINT "UQ_811fd68e5b4830c4e220d673117" UNIQUE ("email"))`
		);
		await queryRunner.query(
			`INSERT INTO "temporary_pending_verification"("id", "email") SELECT "id", "email" FROM "pending_verification"`
		);
		await queryRunner.query(`DROP TABLE "pending_verification"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_pending_verification" RENAME TO "pending_verification"`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "pending_verification" RENAME TO "temporary_pending_verification"`
		);
		await queryRunner.query(
			`CREATE TABLE "pending_verification" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL)`
		);
		await queryRunner.query(
			`INSERT INTO "pending_verification"("id", "email") SELECT "id", "email" FROM "temporary_pending_verification"`
		);
		await queryRunner.query(`DROP TABLE "temporary_pending_verification"`);
		await queryRunner.query(
			`ALTER TABLE "pending_verification" RENAME TO "temporary_pending_verification"`
		);
		await queryRunner.query(
			`CREATE TABLE "pending_verification" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL)`
		);
		await queryRunner.query(
			`INSERT INTO "pending_verification"("id", "email") SELECT "id", "email" FROM "temporary_pending_verification"`
		);
		await queryRunner.query(`DROP TABLE "temporary_pending_verification"`);
	}
}
