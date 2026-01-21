import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, course, isAdmin } = await request.json();

    // Only admins can add dishes
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can add dishes' },
        { status: 403 }
      );
    }

    if (!name || !course || !['first', 'second'].includes(course)) {
      return NextResponse.json(
        { error: 'Name and valid course are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db`
      INSERT INTO dishes (name, course)
      VALUES (${name}, ${course})
      RETURNING id, name, course
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Add dish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { dishId, course, clearAll, isAdmin } = await request.json();

    // Only admins can delete dishes
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete dishes' },
        { status: 403 }
      );
    }

    const db = getDb();

    // Clear all dishes and votes
    if (clearAll) {
      await db`DELETE FROM votes`;
      await db`DELETE FROM dishes`;
      return NextResponse.json({ success: true });
    }

    // Clear all dishes from a specific course
    if (course && ['first', 'second'].includes(course)) {
      const dishResults = await db`
        SELECT id FROM dishes WHERE course = ${course}
      `;

      const dishIds = dishResults.map((d: any) => d.id);

      // Delete votes for these dishes
      if (dishIds.length > 0) {
        for (const id of dishIds) {
          await db`DELETE FROM votes WHERE dish_id = ${id}`;
        }
      }

      // Delete the dishes
      await db`DELETE FROM dishes WHERE course = ${course}`;

      return NextResponse.json({ success: true });
    }

    // Delete a single dish by ID
    if (!dishId) {
      return NextResponse.json(
        { error: 'Dish ID, course, or clearAll is required' },
        { status: 400 }
      );
    }

    // Delete all votes for this dish first
    await db`DELETE FROM votes WHERE dish_id = ${dishId}`;

    // Delete the dish
    await db`DELETE FROM dishes WHERE id = ${dishId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete dish error:', error);
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
    let dishes;

    if (course && ['first', 'second'].includes(course)) {
      dishes = await db`
        SELECT id, name, course FROM dishes
        WHERE course = ${course}
        ORDER BY name
      `;
    } else {
      dishes = await db`
        SELECT id, name, course FROM dishes
        ORDER BY course, name
      `;
    }

    return NextResponse.json(dishes);
  } catch (error) {
    console.error('Get dishes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
