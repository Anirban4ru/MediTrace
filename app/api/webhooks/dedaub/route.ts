import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.DEDAUB_WEBHOOK_SECRET;

    if (!expectedSecret) {
      return NextResponse.json({ error: 'Server misconfiguration: Webhook secret not set' }, { status: 500 });
    }

    if (!authHeader || !safeCompare(authHeader, `Bearer ${expectedSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Dedaub typically sends information about the contract and the decoded event.
    // We expect the payload to include the event name (BatchSpoiled) and the batchId.
    const eventName = payload.event?.name || payload.eventName;
    let batchId = payload.event?.params?.batchId || payload.batchId || payload.data?.batchId;
    let tempCp = payload.event?.params?.temperatureCp || payload.temperatureCp || payload.data?.temperatureCp;

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId in payload' }, { status: 400 });
    }

    const isSpoiledEvent = eventName === 'BatchSpoiled' || payload.alertType === 'BatchSpoiled';

    if (isSpoiledEvent) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 });
      }

      const tempStr = tempCp ? (tempCp / 100).toFixed(1) : 'Unknown';

      // Insert high-priority alert
      const { error } = await supabase.from('alerts').insert({
        batch_id: batchId,
        alert_type: 'on_chain_spoilage',
        message: `[Dedaub] ON-CHAIN BREACH CONFIRMED: Batch ${batchId} was permanently marked as Spoiled. Temp: ${tempStr}°C.`,
        severity: 'critical',
      });

      if (error) {
        console.error('Failed to insert Dedaub alert:', error);
        return NextResponse.json({ error: 'Failed to insert alert' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Spoilage alert recorded' }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' }, { status: 200 });
  } catch (error) {
    console.error('Dedaub webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
