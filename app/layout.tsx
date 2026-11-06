import type { ReactNode } from 'react';
import './style.css';
export const metadata = {title:'Immobili Scout Bari', description:'Ricerca autonoma di locali per poliambulatorio'};
export default function Layout({children}:{children:ReactNode}) { return <html lang="it"><body>{children}</body></html>; }
