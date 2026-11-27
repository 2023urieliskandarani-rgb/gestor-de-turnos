const STORAGE_KEY = 'gestor_turnos_pegatinas_v1';
const LISTA_EMOJIS = ['🌟', '✂️', '💈', '⭐', '✨', '💅'];
const TASA_PEGATINA = 1000;

let appointments = [];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('appointmentForm');
  const dateInput = document.getElementById('appointmentDate');
  const timeInput = document.getElementById('appointmentTime');

  const today = getTodayString();
  dateInput.value = today;
  timeInput.value = '17:08';

  appointments = loadAppointments();
  renderAppointmentsList();
  updateRewardsUI(0, 0, 0);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    procesarTurno();
  });
});

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAppointments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function normalizeTime(hora) {
  return hora ? hora.trim() : '';
}

function findConflict(fecha, hora) {
  const targetHora = normalizeTime(hora);
  return appointments.find((turno) => turno.fecha === fecha && normalizeTime(turno.hora) === targetHora);
}

function suggestNextAvailableTime(fecha, horaSolicitada) {
  const match = /^(\d{2}):(\d{2})$/.exec(horaSolicitada);
  if (!match) return null;

  let totalMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const occupied = new Set(
    appointments
      .filter((t) => t.fecha === fecha)
      .map((t) => normalizeTime(t.hora))
  );

  for (let i = 1; i <= 12; i++) {
    const candidateMin = (totalMinutes + i * 60) % (24 * 60);
    const hh = String(Math.floor(candidateMin / 60)).padStart(2, '0');
    const mm = String(candidateMin % 60).padStart(2, '0');
    const candidate = `${hh}:${mm}`;
    if (!occupied.has(candidate)) {
      return candidate;
    }
  }

  for (let step = 15; step < 24 * 60; step += 15) {
    const candidateMin = (totalMinutes + step) % (24 * 60);
    const hh = String(Math.floor(candidateMin / 60)).padStart(2, '0');
    const mm = String(candidateMin % 60).padStart(2, '0');
    const candidate = `${hh}:${mm}`;
    if (!occupied.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

// Calcula pegatinas base por monto + bono progresivo según cuántas personas hay anotadas
function calcularPegatinas(monto, cantidadPersonasConEsteTurno) {
  const pegatinasBase = Math.floor(monto / TASA_PEGATINA);
  const bonoPorPersonas = Math.floor(cantidadPersonasConEsteTurno / 2);
  return {
    base: pegatinasBase,
    bono: bonoPorPersonas,
    total: pegatinasBase + bonoPorPersonas
  };
}

function procesarTurno() {
  const cliente = document.getElementById('clientName').value.trim();
  const selectServicio = document.getElementById('serviceType');
  const precioServicio = parseFloat(selectServicio.value);
  const nombreServicio = selectServicio.options[selectServicio.selectedIndex].text.split(' (')[0];
  const fecha = document.getElementById('appointmentDate').value;
  const hora = normalizeTime(document.getElementById('appointmentTime').value);

  if (!cliente || !fecha || !hora) {
    showStatusMessage('Completá el nombre, la fecha y la hora del turno.', 'error');
    return;
  }

  const conflicto = findConflict(fecha, hora);
  if (conflicto) {
    const sugerencia = suggestNextAvailableTime(fecha, hora);
    const extraSugerencia = sugerencia
      ? ` Probá por ejemplo a las ${sugerencia} hs o elegí otro día.`
      : ' Elegí otro horario o día.';

    showStatusMessage(
      `Horario no disponible: ${conflicto.cliente} ya tiene turno el ${fecha} a las ${hora} hs.${extraSugerencia}`,
      'error'
    );
    return;
  }

  const posicionPersona = appointments.length + 1;
  const { base, bono, total: pegatinasGanadas } = calcularPegatinas(precioServicio, posicionPersona);

  const nuevoTurno = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    cliente,
    servicio: nombreServicio,
    precio: precioServicio,
    fecha,
    hora,
    pegatinasBase: base,
    bonoPersonas: bono,
    pegatinas: pegatinasGanadas
  };

  appointments.push(nuevoTurno);
  appointments.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  saveAppointments();

  const detalleBono = bono > 0 ? ` (${base} base + ${bono} bono por ${posicionPersona} personas anotadas)` : '';
  showStatusMessage(
    `Turno confirmado para ${cliente} (${nombreServicio}) el ${fecha} a las ${hora} hs. Ganaste ${pegatinasGanadas} pegatina(s)${detalleBono}.`,
    'success'
  );

  renderAppointmentsList();
  updateRewardsUI(precioServicio, pegatinasGanadas, bono);
  document.getElementById('clientName').value = '';
}

function showStatusMessage(text, type) {
  const container = document.getElementById('turnSummary');
  container.className = `status-message ${type}`;
  container.textContent = text;
}

function renderAppointmentsList() {
  const list = document.getElementById('appointmentsList');
  list.innerHTML = '';

  if (appointments.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'placeholder-text';
    empty.textContent = 'Todavía no hay turnos agendados.';
    list.appendChild(empty);
    return;
  }

  appointments.forEach((turno, index) => {
    const li = document.createElement('li');
    li.className = 'appointment-item';

    const infoDiv = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `#${index + 1} ${turno.cliente} — ${turno.servicio}`;

    const meta = document.createElement('div');
    meta.className = 'appointment-meta';
    meta.textContent = `📅 ${turno.fecha} · 🕒 ${turno.hora} hs · $${turno.precio.toLocaleString('es-AR')} ARS`;

    infoDiv.appendChild(title);
    infoDiv.appendChild(meta);

    const badge = document.createElement('span');
    badge.className = 'appointment-badge';
    badge.textContent = `+${turno.pegatinas} 🌟`;

    li.appendChild(infoDiv);
    li.appendChild(badge);
    list.appendChild(li);
  });
}

function updateRewardsUI(ultimoMonto, ultimasPegatinas, ultimoBono) {
  const totalPegatinas = appointments.reduce((acc, item) => acc + item.pegatinas, 0);
  const totalPersonas = appointments.length;

  document.getElementById('displayAmount').textContent = `$${ultimoMonto.toLocaleString('es-AR')} ARS`;

  const bonoTexto = ultimoBono > 0 ? ` · +${ultimoBono} bono (${totalPersonas} anotados)` : '';
  document.getElementById('displayStickers').textContent =
    `${ultimasPegatinas} 🌟${bonoTexto} (Total: ${totalPegatinas})`;

  renderizarPegatinas(totalPegatinas);
}

function renderizarPegatinas(cantidadTotal) {
  const container = document.getElementById('stickerDisplay');
  container.innerHTML = '';

  if (cantidadTotal <= 0) {
    const placeholder = document.createElement('p');
    placeholder.className = 'placeholder-text';
    placeholder.textContent = 'Agenda un turno para ver tus pegatinas coleccionables.';
    container.appendChild(placeholder);
    return;
  }

  for (let i = 0; i < cantidadTotal; i++) {
    const emoji = LISTA_EMOJIS[i % LISTA_EMOJIS.length];
    const span = document.createElement('span');
    span.className = 'sticker-item';
    span.textContent = emoji;
    span.title = `Pegatina #${i + 1}`;
    container.appendChild(span);
  }
}
