import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service';
import { LoginRequestDto } from './dto/login-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates the user's credentials.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Find the employee
    const user = await this.employeesService.findByEmail(email);
    
    // 2. Check if user exists and password matches
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // 3. Strip the password from the result
      const { passwordHash, ...result } = user;
      return result;
    }
    
    return null;
  }

  /**
   * Generates the JWT token.
   */
  async login(user: any) {
    const payload = { email: user.workEmail, sub: user.id, role: user.role };
    
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: 3600, // seconds
      // We must return the user details to satisfy the API Contract & CLI
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.workEmail,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle
      }
    };
  }
}