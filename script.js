// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('appointmentForm');

  // Establecer fecha de hoy por defecto en el input date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointmentDate').value = today;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    procesarTurno();
  });
});

// Función principal que coordina ambas secciones
function procesarTurno() {
  // 1. Recolectar datos del formulario (Sección 1)
  const cliente = document.getElementById('clientName').value;
  const selectServicio = document.getElementById('serviceType');
  const precioServicio = parseFloat(selectServicio.value);
  const nombreServicio = selectServicio.options[selectServicio.selectedIndex].text.split(' (')[0];
  const fecha = document.getElementById('appointmentDate').value;
  const hora = document.getElementById('appointmentTime').value;

  // 2. Renderizar resumen del turno
  mostrarResumenTurno(cliente, nombreServicio, fecha, hora);

  // 3. Pasar respuesta de la Sección 1 a la Sección 2 (Calcular pegatinas)
  const pegatinasGanadas = calcularPegatinas(precioServicio);

  // 4. Actualizar la interfaz del sistema de pegatinas
  actualizarMetricasRecompensa(precioServicio, pegatinasGanadas);
  renderizarPegatinas(pegatinasGanadas);
}

// Subfunción Sección 1: Mostrar confirmación del turno
function mostrarResumenTurno(cliente, servicio, fecha, hora) {
  const container = document.getElementById('turnSummary');
  container.innerHTML = `
    <strong> Turno Confirmado:</strong><br>
    • <strong>Cliente:</strong> ${cliente}<br>
    • <strong>Servicio:</strong> ${servicio}<br>
    • <strong>Fecha y Hora:</strong> ${fecha} a las ${hora} hs
  `;
}

// Subfunción Sección 2: Cálculo de conversión (1 pegatina cada $1.000 ARS)
function calcularPegatinas(monto) {
  const tasaPegatina = 1000;
  return Math.floor(monto / tasaPegatina);
}

// Subfunción Sección 2: Mostrar montos y total de pegatinas
function actualizarMetricasRecompensa(monto, pegatinas) {
  document.getElementById('displayAmount').textContent = `$${monto.toLocaleString('es-AR')} ARS`;
  document.getElementById('displayStickers').textContent = `${pegatinas} 🌟`;
}

// Subfunción Sección 2: Renderizar pegatinas visuales con variedades
function renderizarPegatinas(cantidad) {
  const container = document.getElementById('stickerDisplay');
  container.innerHTML = '';

  const listaEmojis = ['🌟', '✂️', '💈', '⭐', '✨', '💅', '💈'];

  for (let i = 0; i < cantidad; i++) {
    const emoji = listaEmojis[i % listaEmojis.length];
    const span = document.createElement('span');
    span.className = 'sticker-item';
    span.textContent = emoji;
    span.title = `Pegatina #${i + 1}`;
    container.appendChild(span);
  }
}
