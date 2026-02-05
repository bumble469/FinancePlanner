import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getRefreshTokenFromCookie, verifyRefreshToken, clearRefreshTokenCookie } from '@/lib/jwt';

const prisma = new PrismaClient();

interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 * 
 * Industry best practices implemented:
 * - Revoke refresh token in database
 * - Clear refresh token cookie
 * - Optional: Revoke all user tokens (logout all devices)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LogoutResponse>> {
  try {
    // ============================================================
    // GET REFRESH TOKEN FROM COOKIE
    // ============================================================

    const refreshTokenFromCookie = await getRefreshTokenFromCookie();

    if (!refreshTokenFromCookie) {
      // Token not found, but still clear cookie and respond success
      await clearRefreshTokenCookie();
      return NextResponse.json<LogoutResponse>(
        {
          success: true,
          message: 'Logged out successfully',
        },
        { status: 200 }
      );
    }

    // ============================================================
    // VERIFY TOKEN TO GET USER ID
    // ============================================================

    const decoded = await verifyRefreshToken(refreshTokenFromCookie);

    if (decoded) {
      // ============================================================
      // REVOKE REFRESH TOKEN
      // ============================================================

      // Revoke the specific token
      await prisma.refreshToken.update({
        where: { id: decoded.tokenId },
        data: { revokedAt: new Date() },
      }).catch(() => {
        // Token might not exist, ignore error
      });

      // ============================================================
      // OPTIONAL: LOGOUT FROM ALL DEVICES
      // ============================================================
      // Uncomment to revoke all user's refresh tokens on logout

      /*
      await prisma.refreshToken.updateMany({
        where: {
          userId: decoded.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
      */
    }

    // ============================================================
    // CLEAR REFRESH TOKEN COOKIE
    // ============================================================

    await clearRefreshTokenCookie();

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json<LogoutResponse>(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Logout] Error:', error);

    return NextResponse.json<LogoutResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
