import type { MigrationInterface, QueryRunner } from 'typeorm';

export class monikerChangeDate1639484832726 implements MigrationInterface {
	name = 'monikerChangeDate1639484832726';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "passwordHash" varchar NOT NULL, "moniker" varchar NOT NULL, "canChangeMonikerAfter" datetime NOT NULL)`
		);
		await queryRunner.query(
			`INSERT INTO "temporary_user"("id", "email", "passwordHash", "moniker") SELECT "id", "email", "passwordHash", "moniker" FROM "user"`
		);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "passwordHash" varchar NOT NULL, "moniker" varchar NOT NULL)`
		);
		await queryRunner.query(
			`INSERT INTO "user"("id", "email", "passwordHash", "moniker") SELECT "id", "email", "passwordHash", "moniker" FROM "temporary_user"`
		);
		await queryRunner.query(`DROP TABLE "temporary_user"`);
	}
}
