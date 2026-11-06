import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../lib/config';
import { runScout } from '../../../lib/run';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${env('CRON_SECRET')}`) {
    return NextResponse.json({error:'Non autorizzato'},{status:401});
  }
  try { return NextResponse.json({ok:true,...await runScout()}); }
  catch (e) { console.error('Scout cron failure',e); return NextResponse.json({ok:false,error:'Esecuzione fallita: controllare i log server e la tabella runs'}, {status:500}); }
}
