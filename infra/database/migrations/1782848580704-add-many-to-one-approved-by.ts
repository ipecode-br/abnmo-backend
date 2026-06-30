import { MigrationInterface, QueryRunner } from "typeorm";

export class AddManyToOneApprovedBy1782848580704 implements MigrationInterface {
    name = 'AddManyToOneApprovedBy1782848580704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const drops = [
            'IDX_288c989af22446b0a1ab282f5e',
            'REL_288c989af22446b0a1ab282f5e',
        ];

        for (const indexName of drops) {
            try {
                await queryRunner.query(
                    `DROP INDEX \`${indexName}\` ON \`survey_submissions\``,
                );
            } catch {
                // Index may not exist — ignore
            }
        }
    }

    public async down() {}
}
