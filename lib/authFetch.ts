import { refreshToken } from './auth';
import { getSession } from './session';

export const authFetch = async (
  url: string | URL,
  options: RequestInit = {}
) => {
  const session = await getSession();

  if (session?.accessToken) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${session.accessToken}`,
    };
  }

  let res = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401 && session?.refreshToken) {
    const newAccessToken = await refreshToken(session.refreshToken);
    if (newAccessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      res = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
  }

  return res;
};
