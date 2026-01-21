import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const settings = await db`SELECT key, value FROM settings`;

    const result = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value, isAdmin } = await request.json();

    // Only admins can update settings
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update settings' },
        { status: 403 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update or insert setting
    await db`
      INSERT INTO settings (key, value, updated_at)
      VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = ${value},
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
