import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddCategoryIdToProducts1756982301181 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add categoryId column to products table
        await queryRunner.addColumn('products', new TableColumn({
            name: 'categoryId',
            type: 'varchar',
            length: '36',
            isNullable: true,
        }));

        // Add foreign key constraint
        await queryRunner.createForeignKey('products', new TableForeignKey({
            columnNames: ['categoryId'],
            referencedTableName: 'categories',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint
        const table = await queryRunner.getTable('products');
        const foreignKey = table.foreignKeys.find(fk => 
            fk.columnNames.indexOf('categoryId') !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('products', foreignKey);
        }

        // Remove categoryId column
        await queryRunner.dropColumn('products', 'categoryId');
    }

}
