import { cookies } from 'next/headers';
import { verifyAccessToken, type AccessTokenPayload } from '@/lib/jwt';

export async function getAuthUser(): Promise<AccessTokenPayload | null> {
  try {
    const token = (await cookies()).get('access_token')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}