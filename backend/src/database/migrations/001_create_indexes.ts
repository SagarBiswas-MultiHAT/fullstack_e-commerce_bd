import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexes0011711800000000 implements MigrationInterface {
  name = 'CreateIndexes0011711800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_products_slug" ON "products" ("slug")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products" ("category_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_customers_email" ON "customers" ("email")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders" ("customer_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_orders_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_orders_customer_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_customers_email"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_products_category_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_products_slug"');
  }
}
