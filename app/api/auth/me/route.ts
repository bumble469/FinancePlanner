import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ME] Error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
