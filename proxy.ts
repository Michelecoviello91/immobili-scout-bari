import { NextRequest, NextResponse } from 'next/server';
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/cron')) return NextResponse.next();
  const user = process.env.APP_USER;
  const password = process.env.APP_PASSWORD;
  if (!user || !password) return new NextResponse('Configura APP_USER e APP_PASSWORD', {status:503});
  const value = req.headers.get('authorization') || '';
  let valid = false;
  if (value.startsWith('Basic ')) {
    try { valid = atob(value.slice(6)) === `${user}:${password}`; } catch { /* invalid */ }
  }
  if (!valid) return new NextResponse('Accesso riservato', {status:401,headers:{'WWW-Authenticate':'Basic realm="Immobili Scout"','Cache-Control':'no-store'}});
  return NextResponse.next();
}
export const config = {matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
