import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmployeesModule } from '../employees/employees.module'; // Import EmployeesModule
import { AuthConstants } from './constants';

@Module({
  imports: [
    EmployeesModule, // We need this to find users
    PassportModule,
    JwtModule.register({
      secret: AuthConstants.secret,
      signOptions: { expiresIn: AuthConstants.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}