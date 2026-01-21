import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // Get all users with their voting status
    const users = await db`
      SELECT
        u.id,
        u.phone,
        u.name,
        u.is_admin,
        CASE WHEN
          EXISTS(SELECT 1 FROM votes WHERE user_id = u.id AND course = 'first')
          THEN 1 ELSE 0
        END as has_first_vote,
        CASE WHEN
          EXISTS(SELECT 1 FROM votes WHERE user_id = u.id AND course = 'second')
          THEN 1 ELSE 0
        END as has_second_vote
      FROM users u
      ORDER BY u.name
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, isAdmin } = await request.json();

    // Only admins can delete users
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Delete all votes for this user first
    await db`DELETE FROM votes WHERE user_id = ${userId}`;

    // Delete the user
    await db`DELETE FROM users WHERE id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, isAdmin, newIsAdmin, newName } = await request.json();

    // Only admins can update user status
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update user status' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update user's admin status if provided
    if (newIsAdmin !== undefined) {
      await db`
        UPDATE users
        SET is_admin = ${newIsAdmin ? 1 : 0}
        WHERE id = ${userId}
      `;
    }

    // Update user's name if provided
    if (newName !== undefined && newName.trim()) {
      await db`
        UPDATE users
        SET name = ${newName.trim()}
        WHERE id = ${userId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
