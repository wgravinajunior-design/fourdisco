import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/mysql';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const status = searchParams.get('status') || 'inside';

    let sql = 'SELECT * FROM checkins WHERE status = ?';
    const params: unknown[] = [status];

    if (partyId) {
      sql += ' AND party_id = ?';
      params.push(partyId);
    }

    sql += ' ORDER BY checkin_time DESC';
    const rows = await queryMySQL(sql, params);
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
      party_id,
      client_id,
      client_name,
      client_document,
      client_photo,
      document_photo,
      operator_name,
      notes,
    } = body;

    // Check if already checked in
    const existing = await queryMySQL(
      'SELECT id FROM checkins WHERE party_id = ? AND client_document = ? AND status = "inside"',
      [party_id, client_document]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cliente já está com check-in ativo nesta festa!' },
        { status: 400 }
      );
    }

    await queryMySQL(
      `INSERT INTO checkins (id, party_id, client_id, client_name, client_document, client_photo, document_photo, checkin_time, status, operator_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'inside', ?, ?)`,
      [
        id,
        party_id,
        client_id,
        client_name,
        client_document,
        client_photo || null,
        document_photo || null,
        operator_name || 'Portaria',
        notes || null,
      ]
    );

    // Increment client total visits
    await queryMySQL('UPDATE clients SET total_visits = total_visits + 1 WHERE id = ?', [client_id]);

    return NextResponse.json({ success: true, message: 'Check-in realizado com sucesso' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
