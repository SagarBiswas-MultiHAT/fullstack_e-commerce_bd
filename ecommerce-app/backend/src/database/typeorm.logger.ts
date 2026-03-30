import { Logger } from '@nestjs/common';
import type { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';

export class TypeOrmPerformanceLogger implements TypeOrmLogger {
  private readonly logger = new Logger(TypeOrmPerformanceLogger.name);

  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(this.formatQuery(query, parameters));
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    this.logger.error(
      `Query failed: ${this.formatQuery(query, parameters)}`,
      error instanceof Error ? error.stack : String(error),
    );
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ): void {
    this.logger.warn(`Slow query (${time}ms): ${this.formatQuery(query, parameters)}`);
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    this.logger.log(message);
  }

  logMigration(message: string, _queryRunner?: QueryRunner): void {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown, _queryRunner?: QueryRunner): void {
    if (level === 'warn') {
      this.logger.warn(String(message));
      return;
    }

    this.logger.log(String(message));
  }

  private formatQuery(query: string, parameters?: unknown[]) {
    if (!parameters || parameters.length === 0) {
      return query;
    }

    return `${query} -- params: ${JSON.stringify(parameters)}`;
  }
}
