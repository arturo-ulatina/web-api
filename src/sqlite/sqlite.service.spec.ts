import { Test, TestingModule } from '@nestjs/testing';
import { SqliteModule } from './sqlite.module';
import { SqliteService } from './sqlite.service';

describe('SqliteService', () => {
  let module: TestingModule;
  let service: SqliteService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SqliteModule.forRoot({ database: ':memory:' })],
    }).compile();

    service = module.get<SqliteService>(SqliteService);
    service.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, text TEXT)');
  });

  afterEach(async () => {
    await module.close();
  });

  it('should connect to the database', () => {
    expect(service.isConnected()).toBe(true);
  });

  it('should insert and read rows', () => {
    const { changes } = service.run('INSERT INTO notes (text) VALUES (?)', [
      'hello',
    ]);

    expect(changes).toBe(1);
    expect(service.get('SELECT text FROM notes WHERE id = ?', [1])).toEqual({
      text: 'hello',
    });
    expect(service.all('SELECT text FROM notes')).toHaveLength(1);
  });

  it('should roll back failed transactions', () => {
    expect(() =>
      service.transaction(() => {
        service.run('INSERT INTO notes (text) VALUES (?)', ['rolled back']);
        throw new Error('boom');
      }),
    ).toThrow('boom');

    expect(service.all('SELECT * FROM notes')).toHaveLength(0);
  });

  it('should close the connection on shutdown', async () => {
    await module.close();

    expect(service.isConnected()).toBe(false);
  });
});
