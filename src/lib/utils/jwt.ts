import { jwtDecode } from 'jwt-decode';

import { isIRole } from '../types/guards/i-role-tg.ts';

export default function extractRole(token: string) {
  const payload = jwtDecode<{ sub: string; role: string; exp: number }>(token);

  if (!isIRole(payload.role))
    throw new Error('[extractRole] role undefined well');

  return payload.role;
}
