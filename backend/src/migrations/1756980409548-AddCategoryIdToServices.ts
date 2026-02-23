import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryIdToServices1756980409548 implements MigrationInterface {
    name = 'AddCategoryIdToServices1756980409548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`categoryId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_services_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_services_categoryId\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP COLUMN \`categoryId\``);
    }

}
