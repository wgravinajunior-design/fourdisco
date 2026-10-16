import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/mysql';

export async function GET() {
  try {
    const rows = await queryMySQL('SELECT * FROM parties ORDER BY date DESC, created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, date, description, theme_color, max_capacity, status } = body;

    await queryMySQL(
      `INSERT INTO parties (id, name, date, description, theme_color, max_capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name), date = VALUES(date), description = VALUES(description),
       theme_color = VALUES(theme_color), max_capacity = VALUES(max_capacity), status = VALUES(status)`,
      [id, name, date, description || null, theme_color || '#8b5cf6', max_capacity || 500, status || 'active']
    );

    return NextResponse.json({ success: true, message: 'Festa salva com sucesso no MySQL' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
