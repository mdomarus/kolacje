import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, dishId, course } = await request.json();

    if (!userId || !dishId || !course) {
      return NextResponse.json(
        { error: 'userId, dishId, and course are required' },
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

    // Check if dish exists
    const dish = await db`
      SELECT id FROM dishes WHERE id = ${dishId} AND course = ${course}
    `;

    if (!dish || dish.length === 0) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      );
    }

    // Insert or update vote
    await db`
      INSERT INTO votes (user_id, dish_id, course)
      VALUES (${userId}, ${dishId}, ${course})
      ON CONFLICT(user_id, course) DO UPDATE SET
      dish_id = ${dishId},
      created_at = CURRENT_TIMESTAMP
    `;

    const vote = await db`
      SELECT id, user_id, dish_id, course FROM votes
      WHERE user_id = ${userId} AND course = ${course}
    `;

    return NextResponse.json(vote[0]);
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const course = searchParams.get('course');

    const db = getDb();
    let votes;

    if (course && ['first', 'second'].includes(course)) {
      votes = await db`
        SELECT
          d.id,
          d.name,
          COUNT(v.id)::int as vote_count
        FROM dishes d
        LEFT JOIN votes v ON d.id = v.dish_id
        WHERE d.course = ${course}
        GROUP BY d.id
        ORDER BY vote_count DESC, d.name
      `;
    } else {
      votes = await db`
        SELECT
          d.id,
          d.name,
          d.course,
          COUNT(v.id)::int as vote_count
        FROM dishes d
        LEFT JOIN votes v ON d.id = v.dish_id
        GROUP BY d.id
        ORDER BY d.course, vote_count DESC, d.name
      `;
    }

    return NextResponse.json(votes);
  } catch (error) {
    console.error('Get votes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
