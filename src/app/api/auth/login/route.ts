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

    // Insert user if doesn't exist
    await db`
      INSERT INTO users (phone, name) 
      VALUES (${phone}, ${name})
      ON CONFLICT DO NOTHING
    `;

    const user = await db`
      SELECT id, phone, name, is_admin FROM users WHERE phone = ${phone}
    `;

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
