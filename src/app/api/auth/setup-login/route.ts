import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone and name are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if user already exists
    let user = db
      .prepare('SELECT id, phone, name, is_admin FROM users WHERE phone = ?')
      .get(phone);

    if (user) {
      // User already exists, return their data as-is
      return NextResponse.json(user);
    }

    // New user - check if they should be admin
    const isAdmin = phone === '111111111' ? 1 : 0;

    const stmt = db.prepare(
      'INSERT INTO users (phone, name, is_admin) VALUES (?, ?, ?)'
    );

    stmt.run(phone, name, isAdmin);

    // Get the newly created user
    user = db
      .prepare('SELECT id, phone, name, is_admin FROM users WHERE phone = ?')
      .get(phone);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Setup login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
