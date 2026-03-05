import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginRequestDto): Promise<{
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
