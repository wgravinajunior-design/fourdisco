import { NextResponse } from 'next/server';
import { queryMySQL } from '@/lib/mysql';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { checkin_id } = body;

    if (!checkin_id) {
      return NextResponse.json({ success: false, message: 'ID de check-in obrigatório' }, { status: 400 });
    }

    await queryMySQL(
      'UPDATE checkins SET status = "checked_out", checkout_time = NOW() WHERE id = ?',
      [checkin_id]
    );

    return NextResponse.json({ success: true, message: 'Check-out realizado com sucesso' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
