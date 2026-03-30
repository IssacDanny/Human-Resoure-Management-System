export class AuthConstants {
  static readonly secret =
    process.env.JWT_SECRET || 'dev_secret_only_for_local_use';
  static readonly expiresIn = '60m'; // Token validity
}
