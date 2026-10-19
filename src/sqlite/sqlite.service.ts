import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import Database from 'better-sqlite3';

export const SQLITE_OPTIONS = Symbol('SQLITE_OPTIONS');
export const DEFAULT_SQLITE_DATABASE = 'db.sqlite';

export interface SqliteModuleOptions {
  // Path to the database file (created if missing) or ':memory:'
  database?: string;
  // Log every executed statement
  verbose?: boolean;
}

export type SqlParam = string | number | bigint | boolean | Buffer | null;

@Injectable()
export class SqliteService implements OnModuleDestroy {
  private readonly logger = new Logger(SqliteService.name);
  private readonly db: Database.Database;

  constructor(
    @Optional()
    @Inject(SQLITE_OPTIONS)
    options: SqliteModuleOptions = {},
  ) {
    const database =
      options.database ??
      process.env.SQLITE_DATABASE ??
      DEFAULT_SQLITE_DATABASE;

    // better-sqlite3 creates the file but not its parent directories
    if (database !== ':memory:') {
      mkdirSync(dirname(database), { recursive: true });
    }

    this.db = new Database(database, {
      verbose: options.verbose
        ? (sql) => this.logger.debug(String(sql))
        : undefined,
    });

    // SQLite does not enforce foreign keys unless explicitly enabled
    this.db.pragma('foreign_keys = ON');

    this.logger.log(`Connected to SQLite database "${database}"`);
  }

  onModuleDestroy() {
    this.close();
  }

  // Underlying better-sqlite3 connection, for anything not covered below
  get connection(): Database.Database {
    return this.db;
  }

  isConnected(): boolean {
    return this.db.open;
  }

  close() {
    if (this.db.open) {
      this.db.close();
    }
  }

  // Runs one or more statements without parameters (e.g. schema DDL)
  exec(sql: string): void {
    this.db.exec(sql);
  }

  // Runs an INSERT/UPDATE/DELETE. Use `?` placeholders for parameters.
  run(sql: string, params: SqlParam[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...this.normalize(params));
  }

  // Returns the first matching row, or undefined
  get<T>(sql: string, params: SqlParam[] = []): T | undefined {
    return this.db.prepare(sql).get(...this.normalize(params)) as T | undefined;
  }

  // Returns all matching rows
  all<T>(sql: string, params: SqlParam[] = []): T[] {
    return this.db.prepare(sql).all(...this.normalize(params)) as T[];
  }

  // Runs `work` inside a transaction; rolls back if it throws
  transaction<T>(work: () => T): T {
    return this.db.transaction(work)();
  }

  // better-sqlite3 cannot bind booleans
  private normalize(params: SqlParam[]) {
    return params.map((param) =>
      typeof param === 'boolean' ? Number(param) : param,
    );
  }
}
