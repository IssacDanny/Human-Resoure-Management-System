import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AuthConstants.secret,
    });
  }

  /**
   * Validates the payload extracted from the JWT.
   * The return value here is injected into request.user.
   */
  async validate(payload: any) {
    // payload.sub is the userId, payload.email is the email
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}