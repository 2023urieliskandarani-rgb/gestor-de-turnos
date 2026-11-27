// Almacenamiento local de turnos
let appointments = JSON.parse(localStorage.getItem('hospital_appointments')) || [];

// Elementos DOM
const form = document.getElementById('appointmentForm');
const patientNameInput = document.getElementById('patientName');
const specialtySelect = document.getElementById('specialty');
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const appointmentsList = document.getElementById('appointmentsList');
const totalCountBadge = document.getElementById('totalCount');
const alertBox = document.getElementById('alertBox');
const searchInput = document.getElementById('searchInput');

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  setupMinDate();
  generateTimeSlots();
  renderAppointments();

  form.addEventListener('submit', handleAddAppointment);
  searchInput.addEventListener('input', renderAppointments);
});

// Configurar calendario para limitar desde el día de hoy en adelante
function setupMinDate() {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
  dateInput.value = today; // Asigna hoy por defecto
}

// Generar horarios cada 30 minutos (Ejemplo: de 08:00 a 18:00)
function generateTimeSlots() {
  const startHour = 8;
  const endHour = 18;
  timeSelect.innerHTML = '<option value="">Seleccione horario...</option>';

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min of [0, 30]) {
      const hStr = hour.toString().padStart(2, '0');
      const mStr = min.toString().padStart(2, '0');
      const timeSlot = `${hStr}:${mStr}`;

      const option = document.createElement('option');
      option.value = timeSlot;
      option.textContent = `${timeSlot} hs`;
      timeSelect.appendChild(option);
    }
  }
}

// Validación y Registro del Turno
function handleAddAppointment(e) {
  e.preventDefault();

  const name = patientNameInput.value.trim();
  const specialty = specialtySelect.value;
  const date = dateInput.value;
  const time = timeSelect.value;

  if (!name || !specialty || !date || !time) {
    showAlert('Por favor complete todos los campos.', 'error');
    return;
  }

  // VALIDACIÓN OBLIGATORIA: Verificar si ya existe turno en la MISMA FECHA y MISMO HORARIO
  const isConflict = appointments.some(app => app.date === date && app.time === time);

  if (isConflict) {
    showAlert(`El horario ${time} hs ya está ocupado para la fecha ${date}. Seleccione otro horario o fecha.`, 'error');
    return;
  }

  // Crear Objeto Turno
  const newAppointment = {
    id: Date.now().toString(),
    name,
    specialty,
    date,
    time
  };

  // Guardar y Actualizar
  appointments.push(newAppointment);
  saveToLocalStorage();
  renderAppointments();
  
  showAlert('¡Turno registrado exitosamente!', 'success');
  
  // Limpiar campos de texto pero mantener fecha
  patientNameInput.value = '';
  specialtySelect.value = '';
  timeSelect.value = '';
}

// Renderizar la Lista de Turnos Agendados
function renderAppointments() {
  const filterTerm = searchInput.value.toLowerCase().trim();
  
  // Filtrado de búsqueda opcional por nombre
  const filtered = appointments.filter(app => app.name.toLowerCase().includes(filterTerm));

  // Ordenar por fecha y hora
  filtered.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  totalCountBadge.textContent = `${appointments.length} ${appointments.length === 1 ? 'turno' : 'turnos'}`;

  if (filtered.length === 0) {
    appointmentsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>${filterTerm ? 'No se encontraron turnos con ese nombre.' : 'No hay turnos agendados aún.'}</p>
      </div>
    `;
    return;
  }

  appointmentsList.innerHTML = filtered.map(app => `
    <div class="appointment-card">
      <div class="patient-info">
        <h3><i class="fa-solid fa-user-large"></i> ${escapeHtml(app.name)}</h3>
        <div class="patient-meta">
          <span><i class="fa-solid fa-stethoscope"></i> ${app.specialty}</span>
          <span><i class="fa-regular fa-calendar"></i> ${formatDate(app.date)}</span>
          <span><i class="fa-regular fa-clock"></i> ${app.time} hs</span>
        </div>
      </div>
      <button class="btn-delete" onclick="deleteAppointment('${app.id}')" title="Eliminar Turno">
        <i class="fa-solid fa-trash-can"></i> Eliminar
      </button>
    </div>
  `).join('');
}

// Función para Eliminar Turno
function deleteAppointment(id) {
  if (confirm('¿Está seguro de que desea cancelar y eliminar este turno?')) {
    appointments = appointments.filter(app => app.id !== id);
    saveToLocalStorage();
    renderAppointments();
    showAlert('El turno ha sido eliminado.', 'success');
  }
}

// Guardar en LocalStorage
function saveToLocalStorage() {
  localStorage.setItem('hospital_appointments', JSON.stringify(appointments));
}

// Mostrar Alertas Temporales
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.classList.remove('hidden');

  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 4000);
}

// Formatear fecha para lectura humana (YYYY-MM-DD a DD/MM/YYYY)
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Evitar inyecciones HTML en nombres
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => {
    const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return chars[match];
  });
}
