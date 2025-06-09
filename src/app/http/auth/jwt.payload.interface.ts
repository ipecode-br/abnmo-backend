export interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}
