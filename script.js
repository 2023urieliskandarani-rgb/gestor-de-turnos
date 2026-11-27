document.addEventListener('DOMContentLoaded', () => {
  const turnoForm = document.getElementById('turnoForm');
  const fechaInput = document.getElementById('fecha');
  const horarioSelect = document.getElementById('horario');
  const horaInicioInput = document.getElementById('horaInicio');
  const horaFinInput = document.getElementById('horaFin');
  const btnActualizarHorarios = document.getElementById('btnActualizarHorarios');
  const listaTurnos = document.getElementById('listaTurnos');
  const contadorTurnos = document.getElementById('contadorTurnos');
  const buscarTurnoInput = document.getElementById('buscarTurno');
  const mensajeAlerta = document.getElementById('mensajeAlerta');

  let turnos = JSON.parse(localStorage.getItem('turnosHospital')) || [];

  function establecerFechaMinima() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaMin = `${anio}-${mes}-${dia}`;
    fechaInput.min = fechaMin;
    if (!fechaInput.value) {
      fechaInput.value = fechaMin;
    }
  }

  function generarIntervalosHorarios() {
    horarioSelect.innerHTML = '';
    const inicioStr = horaInicioInput.value;
    const finStr = horaFinInput.value;

    if (!inicioStr || !finStr) return;

    const [hIni, mIni] = inicioStr.split(':').map(Number);
    const [hFin, mFin] = finStr.split(':').map(Number);

    let minutosActuales = hIni * 60 + mIni;
    const minutosLimite = hFin * 60 + mFin;

    if (minutosActuales >= minutosLimite) {
      mostrarAlerta('La hora de apertura debe ser anterior a la de cierre.', 'error');
      return;
    }

    while (minutosActuales < minutosLimite) {
      const hh = String(Math.floor(minutosActuales / 60)).padStart(2, '0');
      const mm = String(minutosActuales % 60).padStart(2, '0');
      const horaFormateada = `${hh}:${mm}`;

      const option = document.createElement('option');
      option.value = horaFormateada;
      option.textContent = horaFormateada;
      horarioSelect.appendChild(option);

      minutosActuales += 30;
    }
  }

  function mostrarAlerta(texto, tipo) {
    mensajeAlerta.textContent = texto;
    mensajeAlerta.className = `alerta ${tipo}`;
    setTimeout(() => {
      mensajeAlerta.classList.add('oculto');
    }, 3500);
  }

  turnoForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const paciente = document.getElementById('paciente').value.trim();
    const dni = document.getElementById('dni').value.trim();
    const especialidad = document.getElementById('especialidad').value;
    const fecha = fechaInput.value;
    const horario = horarioSelect.value;

    const horarioOcupado = turnos.some(
      (t) => t.fecha === fecha && t.horario === horario
    );

    if (horarioOcupado) {
      mostrarAlerta(
        `El horario ${horario} del día ${fecha} ya está ocupado. Elegí otro horario o fecha.`,
        'error'
      );
      return;
    }

    const nuevoTurno = {
      id: Date.now(),
      paciente,
      dni,
      especialidad,
      fecha,
      horario
    };

    turnos.push(nuevoTurno);
    guardarYRenderizar();
    mostrarAlerta('Turno asignado correctamente.', 'exito');

    document.getElementById('paciente').value = '';
    document.getElementById('dni').value = '';
    document.getElementById('especialidad').selectedIndex = 0;
  });

  function renderizarTurnos(filtro = '') {
    listaTurnos.innerHTML = '';

    const turnosOrdenados = [...turnos].sort((a, b) => {
      const fechaHoraA = `${a.fecha} ${a.horario}`;
      const fechaHoraB = `${b.fecha} ${b.horario}`;
      return fechaHoraA.localeCompare(fechaHoraB);
    });

    const turnosFiltrados = turnosOrdenados.filter((t) =>
      t.paciente.toLowerCase().includes(filtro.toLowerCase()) ||
      t.dni.includes(filtro) ||
      t.especialidad.toLowerCase().includes(filtro.toLowerCase())
    );

    contadorTurnos.textContent = `${turnosFiltrados.length} ${turnosFiltrados.length === 1 ? 'turno' : 'turnos'}`;

    if (turnosFiltrados.length === 0) {
      listaTurnos.innerHTML = '<p class="vacio-msg">No hay turnos agendados aún.</p>';
      return;
    }

    turnosFiltrados.forEach((turno) => {
      const item = document.createElement('div');
      item.className = 'turno-item';
      item.innerHTML = `
        <div class="turno-datos">
          <h4>${turno.paciente}</h4>
          <p><strong>DNI:</strong> ${turno.dni} | <strong>Especialidad:</strong> ${turno.especialidad}</p>
          <span class="turno-fecha-hora">${turno.fecha} — ${turno.horario} hs</span>
        </div>
        <button class="btn-eliminar" data-id="${turno.id}">Eliminar</button>
      `;
      listaTurnos.appendChild(item);
    });
  }

  listaTurnos.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar')) {
      const idEliminar = Number(e.target.getAttribute('data-id'));
      turnos = turnos.filter((t) => t.id !== idEliminar);
      guardarYRenderizar();
    }
  });

  function guardarYRenderizar() {
    localStorage.setItem('turnosHospital', JSON.stringify(turnos));
    renderizarTurnos(buscarTurnoInput.value);
  }

  btnActualizarHorarios.addEventListener('click', () => {
    generarIntervalosHorarios();
    mostrarAlerta('Horarios del consultor actualizados.', 'exito');
  });

  buscarTurnoInput.addEventListener('input', (e) => {
    renderizarTurnos(e.target.value);
  });

  establecerFechaMinima();
  generarIntervalosHorarios();
  renderizarTurnos();
});
