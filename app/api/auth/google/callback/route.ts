import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AccountType } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_TTL,
} from '@/lib/jwt';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.id_token) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve id_token' },
        { status: 401 }
      );
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google payload' },
        { status: 401 }
      );
    }

    const providerAccountId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || null;
    const image = payload.picture || null;

    // 3️⃣ Check existing OAuthAccount
    let oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        provider: 'google',
        providerAccountId,
      },
      include: { user: true },
    });

    let user;

    if (oauthAccount) {
      // ✅ Existing Google user → LOGIN
      user = oauthAccount.user;
    } else {
      // 4️⃣ Check if user exists by email
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // 🆕 First time Google user → SIGNUP
        user = await prisma.user.create({
          data: {
            email,
            name,
            image,
            emailVerified: new Date(),
            role: 'user',
          },
        });

        await prisma.account.create({
          data: {
            userId: user.id,
            name: `${name || 'My'} Account`,
            type: AccountType.INDIVIDUAL,
          },
        });
      }

      // 🔗 Link OAuth account
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          id_token: tokenData.id_token,
        },
      });
    }

    // 5️⃣ Issue tokens
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
    });

    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
      },
    });

    const refreshToken = await generateRefreshToken(
      user.id,
      refreshTokenRecord.id
    );

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/`
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

    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}
