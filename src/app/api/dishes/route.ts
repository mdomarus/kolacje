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
    const stmt = db.prepare(
      'INSERT INTO dishes (name, course) VALUES (?, ?)'
    );

    const result = stmt.run(name, course);

    const dish = db
      .prepare('SELECT id, name, course FROM dishes WHERE id = ?')
      .get(result.lastInsertRowid);

    return NextResponse.json(dish);
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
      db.prepare('DELETE FROM votes').run();
      db.prepare('DELETE FROM dishes').run();
      return NextResponse.json({ success: true });
    }

    // Clear all dishes from a specific course
    if (course && ['first', 'second'].includes(course)) {
      const dishResults = db
        .prepare('SELECT id FROM dishes WHERE course = ?')
        .all(course) as { id: number }[];

      const dishIds = dishResults.map((d) => d.id);

      // Delete votes for these dishes
      if (dishIds.length > 0) {
        const placeholders = dishIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM votes WHERE dish_id IN (${placeholders})`).run(
          ...dishIds
        );
      }

      // Delete the dishes
      const result = db
        .prepare('DELETE FROM dishes WHERE course = ?')
        .run(course);

      return NextResponse.json({ success: result.changes > 0 });
    }

    // Delete a single dish by ID
    if (!dishId) {
      return NextResponse.json(
        { error: 'Dish ID, course, or clearAll is required' },
        { status: 400 }
      );
    }

    // Delete all votes for this dish first
    db.prepare('DELETE FROM votes WHERE dish_id = ?').run(dishId);

    // Delete the dish
    const result = db.prepare('DELETE FROM dishes WHERE id = ?').run(dishId);

    return NextResponse.json({ success: result.changes > 0 });
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
      dishes = db
        .prepare('SELECT id, name, course FROM dishes WHERE course = ? ORDER BY name')
        .all(course);
    } else {
      dishes = db
        .prepare('SELECT id, name, course FROM dishes ORDER BY course, name')
        .all();
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
