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
    let user = await db`
      SELECT id, phone, name, is_admin FROM users WHERE phone = ${phone}
    `;

    if (user && user.length > 0) {
      // User already exists, return their data as-is
      return NextResponse.json(user[0]);
    }

    // New user - check if they should be admin
    const isAdmin = phone === '111111111' ? 1 : 0;

    await db`
      INSERT INTO users (phone, name, is_admin)
      VALUES (${phone}, ${name}, ${isAdmin})
    `;

    // Get the newly created user
    user = await db`
      SELECT id, phone, name, is_admin FROM users WHERE phone = ${phone}
    `;

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error('Setup login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
