export function getCookieValue(
  cookieName: string,
  cookieString: string,
): string | undefined {
  const cookies = cookieString.split(';').map((cookie) => cookie.trim());
  const cookie = cookies.find((c) => c.startsWith(`${cookieName}=`));
  if (cookie) {
    return cookie.split('=')[1];
  }
  return undefined;
}
