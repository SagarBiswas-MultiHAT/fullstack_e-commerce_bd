import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerformanceIndexes0021711800000001 implements MigrationInterface {
  name = 'PerformanceIndexes0021711800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_products_active_created_at" ON "products" ("is_active", "created_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_products_category_active" ON "products" ("category_id", "is_active")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_products_price" ON "products" ("price")',
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_orders_customer_created_at" ON "orders" ("customer_id", "created_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_orders_status_perf" ON "orders" ("status")',
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_reviews_product_created_at" ON "reviews" ("product_id", "created_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_reviews_product_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_orders_status_perf"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_orders_customer_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_products_price"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_products_category_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_products_active_created_at"');
  }
}
