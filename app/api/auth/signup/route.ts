import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  REFRESH_TOKEN_TTL,
} from '@/lib/jwt';

const prisma = new PrismaClient();

interface SignupRequestBody {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  accountName?: string;
  accountType?: 'INDIVIDUAL' | 'COMPANY' | 'CLUB';
}

interface SignupResponse {
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
): Promise<NextResponse<SignupResponse>> {
  try {
    const body = (await request.json()) as SignupRequestBody;
    const errors: Record<string, string> = {};

    const email = body.email?.toLowerCase().trim();

    if (!email) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (body.name && body.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const passwordValidation = validatePasswordStrength(body.password || '');
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors.join('; ');
    }

    if (body.password !== body.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors,
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
          errors: { email: 'This email is already in use' },
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: body.name?.trim() || null,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        name: body.accountName || 'My Account',
        type: body.accountType || 'INDIVIDUAL',
      },
    });

    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      role: 'user',
    });

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIp(request) || undefined,
      },
    });

    const refreshToken = await generateRefreshToken(
      user.id,
      refreshTokenRecord.id
    );

    await setRefreshTokenCookie(refreshToken, REFRESH_TOKEN_TTL);

    return NextResponse.json(
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
      { status: 201 }
    );
  } catch (error) {
    console.error('[Signup] Error:', error);

    return NextResponse.json(
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
