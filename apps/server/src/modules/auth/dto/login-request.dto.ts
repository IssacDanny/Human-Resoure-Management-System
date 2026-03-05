import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * LoginRequestDto
 * 
 * RESPONSIBILITY:
 * - Validates the payload for POST /auth/login.
 * - Enforces that email is a valid email format.
 * - Enforces that password is not empty.
 * 
 * MATCHES OPENAPI: components/schemas/LoginRequest
 */
export class LoginRequestDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}