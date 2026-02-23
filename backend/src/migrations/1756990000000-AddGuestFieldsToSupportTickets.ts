import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGuestFieldsToSupportTickets1756990000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make userId nullable in support_tickets
    await queryRunner.changeColumn(
      'support_tickets',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'char',
        length: '36',
        isNullable: true,
      }),
    );

    // Add guest fields to support_tickets
    await queryRunner.addColumns('support_tickets', [
      new TableColumn({
        name: 'guestName',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guestEmail',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'guestPhone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
      new TableColumn({
        name: 'petType',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    ]);

    // Make userId nullable in support_messages
    await queryRunner.changeColumn(
      'support_messages',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'char',
        length: '36',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make userId non-nullable in support_messages
    await queryRunner.changeColumn(
      'support_messages',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'char',
        length: '36',
        isNullable: false,
      }),
    );

    // Remove guest fields from support_tickets
    await queryRunner.dropColumn('support_tickets', 'guestName');
    await queryRunner.dropColumn('support_tickets', 'guestEmail');
    await queryRunner.dropColumn('support_tickets', 'guestPhone');
    await queryRunner.dropColumn('support_tickets', 'petType');

    // Make userId non-nullable in support_tickets
    await queryRunner.changeColumn(
      'support_tickets',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'char',
        length: '36',
        isNullable: false,
      }),
    );
  }
}
