import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { SqliteService } from '../sqlite/sqlite.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: SqliteService,
          useValue: {
            exec: jest.fn(),
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
