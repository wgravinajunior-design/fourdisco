import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/mysql';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const document = searchParams.get('document');

    if (document) {
      const rows = await queryMySQL(
        `SELECT * FROM blacklist 
         WHERE (document = ? OR REPLACE(REPLACE(REPLACE(document, ".", ""), "-", ""), "/", "") = ?)
         AND status = 'active'
         AND (ban_type = 'indefinite' OR (ban_type = 'period' AND (end_date IS NULL OR end_date >= CURDATE())))
         LIMIT 1`,
        [document, document.replace(/\D/g, '')]
      );
      return NextResponse.json({
        success: true,
        isBlacklisted: rows && rows.length > 0,
        entry: rows && rows.length > 0 ? rows[0] : null,
      });
    }

    const rows = await queryMySQL('SELECT * FROM blacklist ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, client_id, document, name, photo_url, reason, ban_type, start_date, end_date, added_by } = body;

    await queryMySQL(
      `INSERT INTO blacklist (id, client_id, document, name, photo_url, reason, ban_type, start_date, end_date, added_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE
       reason = VALUES(reason), ban_type = VALUES(ban_type), start_date = VALUES(start_date),
       end_date = VALUES(end_date), status = 'active'`,
      [
        id,
        client_id || null,
        document,
        name,
        photo_url || null,
        reason,
        ban_type || 'indefinite',
        start_date,
        end_date || null,
        added_by || 'Administrador',
      ]
    );

    return NextResponse.json({ success: true, message: 'Registro adicionado à blacklist' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
