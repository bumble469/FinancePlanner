import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  getRefreshTokenFromCookie,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  REFRESH_TOKEN_TTL,
} from '@/lib/jwt';

const prisma = new PrismaClient();

interface RefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
  };
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RefreshResponse>> {
  try {
    const refreshTokenFromCookie = await getRefreshTokenFromCookie();

    if (!refreshTokenFromCookie) {
      return NextResponse.json<RefreshResponse>(
        {
          success: false,
          error: 'No refresh token provided',
        },
        { status: 401 }
      );
    }

    const decoded = await verifyRefreshToken(refreshTokenFromCookie);

    if (!decoded) {
      return NextResponse.json<RefreshResponse>(
        {
          success: false,
          error: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );
    }

    // ============================================================
    // CHECK REFRESH TOKEN IN DATABASE
    // ============================================================

    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Verify token exists and is not revoked
    if (!refreshTokenRecord || refreshTokenRecord.revokedAt !== null) {
      return NextResponse.json<RefreshResponse>(
        {
          success: false,
          error: 'Refresh token has been revoked',
        },
        { status: 401 }
      );
    }

    // Verify token expiry
    if (new Date() > refreshTokenRecord.expiresAt) {
      return NextResponse.json<RefreshResponse>(
        {
          success: false,
          error: 'Refresh token has expired',
        },
        { status: 401 }
      );
    }

    // ============================================================
    // GENERATE NEW ACCESS TOKEN
    // ============================================================

    const { user } = refreshTokenRecord;

    const newAccessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    });

    // ============================================================
    // OPTIONAL: REFRESH TOKEN ROTATION
    // ============================================================
    // Implement refresh token rotation for additional security
    // Uncomment to enable rotation (generates new refresh token on each refresh)

    /*
    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: decoded.tokenId },
      data: { revokedAt: new Date() },
    });

    // Create new refresh token
    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIp(request) || undefined,
      },
    });

    const newRefreshToken = await generateRefreshToken(user.id, newRefreshTokenRecord.id);

    // Set new refresh token cookie
    await setRefreshTokenCookie(newRefreshToken, REFRESH_TOKEN_TTL);
    */

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json<RefreshResponse>(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Refresh] Error:', error);

    return NextResponse.json<RefreshResponse>(
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

/**
 * Helper: Extract client IP from request
 */
function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null
  );
}
