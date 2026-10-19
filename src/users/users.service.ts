import { randomUUID } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SqliteService } from '../sqlite/sqlite.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

// Columns that can be changed through UpdateUserDto
const UPDATABLE_COLUMNS = ['name', 'email', 'password'] as const;

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly sqlite: SqliteService) {}

  // Create the users table on startup if it does not exist yet
  onModuleInit() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        lastname TEXT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        age INTEGER,
        role TEXT NOT NULL DEFAULT 'Reader'
      )
    `);
  }

  async create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;

    // Validate email, name and password
    if (!email || !name || !password) {
      throw new Error('Email, name and password are required');
    }

    // Validate that the password is strong (at last 8 chars, one mayus, one digit and one number) and document with comments
    if (
      password.length < 8 ||
      !password.match(/[A-Z]/) ||
      !password.match(/[0-9]/) ||
      !password.match(/[^A-Za-z0-9]/)
    ) {
      throw new Error(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one digit and one special character',
      );
    }

    // Validate that the email is in a valid format with a regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email is not valid');
    }

    // Validate that the email is not already in use
    const emailExists = this.sqlite.get<User>(
      'SELECT id FROM user WHERE email = ?',
      [email],
    );
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const id = randomUUID();
    this.sqlite.run(
      'INSERT INTO user (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, 'Reader'],
    );

    return this.findOne(id);
  }

  findAll() {
    return this.sqlite.all<User>('SELECT * FROM user');
  }

  async findOne(id: string) {
    const userExist = this.sqlite.get<User>('SELECT * FROM user WHERE id = ?', [
      id,
    ]);

    if (!userExist) {
      throw new Error('User not found');
    }

    return userExist;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Throws if the user does not exist
    await this.findOne(id);

    const columns = UPDATABLE_COLUMNS.filter(
      (column) => updateUserDto[column] !== undefined,
    );

    if (columns.length > 0) {
      this.sqlite.run(
        `UPDATE user SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...columns.map((column) => updateUserDto[column] ?? null), id],
      );
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    this.sqlite.run('DELETE FROM user WHERE id = ?', [id]);

    return user;
  }
}
