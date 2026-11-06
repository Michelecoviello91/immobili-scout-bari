export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Configurazione mancante: ${name}`);
  return value;
}
export const MAX_PRICE = 200_000;
export const MIN_AREA = 80;
export const MAX_AREA = 200;
