export class User {
  id: string;
  name: string;
  lastname?: string | null;
  email: string;
  password: string;
  age?: number | null;
  role: string;
}
