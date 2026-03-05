import { JwtService } from '@nestjs/jwt';
import { EmployeesService } from '../employees/employees.service';
export declare class AuthService {
    private readonly employeesService;
    private readonly jwtService;
    constructor(employeesService: EmployeesService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        accessToken: string;
        expiresIn: number;
        user: {
            id: any;
            fullName: any;
            email: any;
            role: any;
            department: any;
            jobTitle: any;
        };
    }>;
}
