import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/mysql';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const document = searchParams.get('document');

    if (document) {
      const rows = await queryMySQL(
        'SELECT * FROM clients WHERE document = ? OR REPLACE(REPLACE(REPLACE(document, ".", ""), "-", ""), "/", "") = ? LIMIT 1',
        [document, document.replace(/\D/g, '')]
      );
      return NextResponse.json({ success: true, data: rows ? rows[0] : null });
    }

    const rows = await queryMySQL('SELECT * FROM clients ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      document,
      document_type,
      birth_date,
      gender,
      phone,
      email,
      photo_url,
      document_photo_url,
      notes,
      is_vip,
    } = body;

    await queryMySQL(
      `INSERT INTO clients (id, name, document, document_type, birth_date, gender, phone, email, photo_url, document_photo_url, notes, is_vip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       name = VALUES(name), document_type = VALUES(document_type), birth_date = VALUES(birth_date),
       gender = VALUES(gender), phone = VALUES(phone), email = VALUES(email),
       photo_url = COALESCE(VALUES(photo_url), photo_url),
       document_photo_url = COALESCE(VALUES(document_photo_url), document_photo_url),
       notes = VALUES(notes), is_vip = VALUES(is_vip)`,
      [
        id,
        name,
        document,
        document_type || 'CPF',
        birth_date || null,
        gender || null,
        phone || null,
        email || null,
        photo_url || null,
        document_photo_url || null,
        notes || null,
        is_vip ? 1 : 0,
      ]
    );

    return NextResponse.json({ success: true, message: 'Cliente registrado com sucesso' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
