import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const course = searchParams.get('course');

    if (!userId || !course) {
      return NextResponse.json(
        { error: 'userId and course are required' },
        { status: 400 }
      );
    }

    if (!['first', 'second'].includes(course)) {
      return NextResponse.json(
        { error: 'course must be either "first" or "second"' },
        { status: 400 }
      );
    }

    const db = getDb();

    const vote = await db`
      SELECT dish_id, course FROM votes
      WHERE user_id = ${userId} AND course = ${course}
    `;

    if (!vote || vote.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(vote[0]);
  } catch (error) {
    console.error('Get user vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
