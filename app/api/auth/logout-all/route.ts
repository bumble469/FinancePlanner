import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getRefreshTokenFromCookie, verifyRefreshToken, clearRefreshTokenCookie, clearAccessTokenCookie } from '@/lib/jwt';

const prisma = new PrismaClient();

interface LogoutAllResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LogoutAllResponse>> {
  try {
    const refreshTokenFromCookie = await getRefreshTokenFromCookie();

    if (!refreshTokenFromCookie) {
      await clearRefreshTokenCookie();
      return NextResponse.json<LogoutAllResponse>(
        { success: true, message: 'Logged out from all devices successfully' },
        { status: 200 }
      );
    }

    const decoded = await verifyRefreshToken(refreshTokenFromCookie);

    if (decoded) {
      await prisma.refreshToken.updateMany({
        where: {
          userId: decoded.sub,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
    await clearAccessTokenCookie();
    await clearRefreshTokenCookie();

    return NextResponse.json<LogoutAllResponse>(
      { success: true, message: 'Logged out from all devices successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Logout All] Error:', error);
    return NextResponse.json<LogoutAllResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}