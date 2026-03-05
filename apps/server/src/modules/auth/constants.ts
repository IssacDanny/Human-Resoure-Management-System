export class AuthConstants {
  // TODO: Move this to process.env.JWT_SECRET in production!
  static readonly secret = 'DO_NOT_USE_THIS_VALUE_IN_PRODUCTION_OR_STERLING_WILL_BE_UPSET';
  static readonly expiresIn = '60m'; // Token validity
}