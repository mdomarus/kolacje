import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dishId = searchParams.get('dishId');

    if (!dishId) {
      return NextResponse.json(
        { error: 'dishId is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get all users who voted for this dish
    const voters = await db`
      SELECT u.id, u.name, u.phone
      FROM votes v
      JOIN users u ON v.user_id = u.id
      WHERE v.dish_id = ${dishId}
      ORDER BY u.name
    `;

    return NextResponse.json(voters);
  } catch (error) {
    console.error('Get dish voters error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
