import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, REFRESH_TOKEN_TTL } from '@/lib/jwt';

const prisma = new PrismaClient();

interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  };
  error?: string;
  errors?: Record<string, string>;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const errors: Record<string, string> = {};

    if (!body.email || !body.password) {
      errors.general = 'Email and password are required';
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'Invalid email or password',
          errors: { general: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(body.password, user.password);

    if (!passwordMatch) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: 'Invalid email or password',
          errors: { general: 'Invalid email or password' },
        },
        { status: 401 }
      );
    }

    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role,
    });

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIp(request) || undefined,
      },
    });

    const refreshToken = await generateRefreshToken(user.id, refreshTokenRecord.id);

    await setRefreshTokenCookie(refreshToken, REFRESH_TOKEN_TTL);

    return NextResponse.json<LoginResponse>(
      {
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Login] Error:', error);

    return NextResponse.json<LoginResponse>(
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

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null
  );
}
