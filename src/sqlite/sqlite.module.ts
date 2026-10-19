import { DynamicModule, Module } from '@nestjs/common';
import { SQLITE_OPTIONS, SqliteService } from './sqlite.service';
import type { SqliteModuleOptions } from './sqlite.service';

@Module({})
export class SqliteModule {
  /**
   * Creates (or opens) the SQLite database and makes SqliteService
   * available to every module. Import once, in the root module.
   */
  static forRoot(options: SqliteModuleOptions = {}): DynamicModule {
    return {
      module: SqliteModule,
      global: true,
      providers: [
        { provide: SQLITE_OPTIONS, useValue: options },
        SqliteService,
      ],
      exports: [SqliteService],
    };
  }
}
