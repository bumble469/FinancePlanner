import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AccountType } from '@prisma/client';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_TTL,
} from '@/lib/jwt';

const prisma = new PrismaClient();

interface SignupRequestBody {
  email: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  accountName?: string;
  accountType?: AccountType;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupRequestBody;
    const errors: Record<string, string> = {};

    const email = body.email?.toLowerCase().trim();

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!body.password) {
      errors.password = 'Password is required';
    } else {
      const validation = validatePasswordStrength(body.password);
      if (!validation.valid) {
        errors.password = validation.errors.join('; ');
      }
      if (body.password !== body.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (body.name && body.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors },
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

    const hashedPassword = await hashPassword(body.password!);

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
        type: body.accountType || AccountType.INDIVIDUAL,
      },
    });

    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
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

    const response = NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          user,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: REFRESH_TOKEN_TTL / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    null
  );
}
