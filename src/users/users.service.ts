import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto) {
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
    const emailExists = this.users.find((user) => user.email === email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const role: string = 'Reader';

    // Create an user and generate an ID for him with an UUID
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 15),
      email,
      name,
      password,
      role,
    };

    // Save the newUser into the users list
    this.users.push(newUser);

    return newUser;
  }

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    const userExist = this.users.find((user) => user.id === id);

    if (!userExist) {
      throw new Error('User not found');
    }

    return userExist;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...this.users[userIndex],
      ...updateUserDto,
    };

    this.users[userIndex] = updatedUser;

    return updatedUser;
  }

  remove(id: string) {
    const userIndex = this.users.findIndex((user) => user.id === id.toString());

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const deletedUser = this.users.splice(userIndex, 1)[0];

    return deletedUser;
  }
}
