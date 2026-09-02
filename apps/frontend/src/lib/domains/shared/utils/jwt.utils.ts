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
