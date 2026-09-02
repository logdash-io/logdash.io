export type JwtPayload = {
  id?: string;
  iat?: number;
  exp?: number;
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  const encodedPayload = token.split('.')[1];

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
};

export const tokenMaxAge = (token: string): number | null => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return null;
  }

  const maxAge = payload.exp - Math.floor(Date.now() / 1000);

  return maxAge > 0 ? maxAge : null;
};
