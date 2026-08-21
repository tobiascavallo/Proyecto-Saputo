// Formatea fechas en el formato exacto que espera el backend Go — sin
// librería externa, alcanza con Date + padStart.
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// "YYYY-MM-DD" — usado para el campo "fecha" del remito, siempre hoy.
export function fechaDeHoy(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}`;
}

// "YYYY-MM-DDTHH:mm:ss" — usado para "hora_recoleccion" de cada línea,
// siempre el momento en que se guarda (dto.CrearLineaRecoleccionRequest
// espera exactamente este formato, sin milisegundos ni zona horaria).
export function ahoraISO(): string {
  const ahora = new Date();
  const fecha = fechaDeHoy();
  return `${fecha}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}
