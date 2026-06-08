export type GoogleHealthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  healthUserId?: string;
};
