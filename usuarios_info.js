const usuario = JSON.parse(localStorage.getItem("usuarioSeleccionado"));
const auth = localStorage.getItem("auth");

const BASE_FICHAJES = "http://localhost:8080/fichaje";
const BASE_TURNOS = "http://localhost:8080/turno";

function soloFechaISO(date) {
    return new Date(date).toISOString().split("T")[0];
}

let turnosGlobal = [];

function esHoraValida(hora) {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(hora);
}

//NUEVO: comprobar si es del mes actual
function esDelMesActual(fecha) {
    const hoy = new Date();
    const f = new Date(fecha);

    return (
        f.getMonth() === hoy.getMonth() &&
        f.getFullYear() === hoy.getFullYear()
    );
}

// INFO USUARIO
function cargarInfoUsuario() {
    document.getElementById("nombreUsuario").textContent =
        usuario.nombre + " " + usuario.apellidos;

    document.getElementById("emailUsuario").textContent =
        "Email: " + usuario.email;

    document.getElementById("rolUsuario").textContent =
        "Rol: " + usuario.rol;

    document.getElementById("puestoUsuario").textContent =
        "Puesto: " + usuario.tipoPuesto;
}

// TURNOS
async function cargarTurnos() {
    try {
        const res = await fetch(`${BASE_TURNOS}/empleado/${usuario.idEmpleado}`, {
            headers: { "Authorization": "Basic " + auth }
        });

        if (!res.ok) throw new Error();

        turnosGlobal = await res.json();

        //FILTRAR SOLO MES ACTUAL
        turnosGlobal = turnosGlobal.filter(t => {
            const fechaInicio = t.fechaInicio.split(" ")[0];
            return esDelMesActual(fechaInicio);
        });

        const tbody = document.getElementById("tablaTurnosBody");
        tbody.innerHTML = "";

        turnosGlobal.forEach((t, index) => {
            tbody.innerHTML += `
                <tr>
                    <td><input type="checkbox" class="turno-check" value="${index}"></td>
                    <td>${t.tipoTurno}</td>
                    <td>${t.fechaInicio}</td>
                    <td>${t.fechaFin}</td>
                </tr>
            `;
        });

    } catch {
        alert("Error al cargar turnos");
    }
}

// ABRIR MODAL
function editarTurnosSeleccionados() {
    const checks = document.querySelectorAll(".turno-check:checked");

    if (checks.length === 0) {
        alert("Selecciona al menos un turno");
        return;
    }

    document.getElementById("modalTurnos").style.display = "block";

    if (usuario.tipoPuesto === "PRODUCCIÓN") {
        document.getElementById("grupoTipoTurno").style.display = "block";
    } else {
        document.getElementById("grupoTipoTurno").style.display = "none";
    }
}

// GUARDAR CAMBIOS
function guardarCambiosTurnos() {
    const checks = document.querySelectorAll(".turno-check:checked");
    const horaInicio = document.getElementById("horaInicioInput").value;
    const horaFin = document.getElementById("horaFinInput").value;
    const tipoTurno = document.getElementById("tipoTurnoSelect").value;

    if (!esHoraValida(horaInicio) || !esHoraValida(horaFin)) {
        alert("Horas inválidas");
        return;
    }

    checks.forEach(check => {
        const turno = turnosGlobal[check.value];
        const fechaInicio = turno.fechaInicio.split(" ")[0];
        const fechaFin = turno.fechaFin.split(" ")[0];
        turno.fechaInicio = `${fechaInicio} ${horaInicio}:00`;
        turno.fechaFin = `${fechaFin} ${horaFin}:00`;

        if (usuario.tipoPuesto === "PRODUCCIÓN") {
            turno.tipoTurno = tipoTurno;
        }
    });

    cerrarModal();
    actualizarTurnos();
}

// CERRAR MODAL
function cerrarModal() {
    document.getElementById("modalTurnos").style.display = "none";
    document.getElementById("horaInicioInput").value = "";
    document.getElementById("horaFinInput").value = "";
}

// ACTUALIZAR BACKEND
async function actualizarTurnos() {
    const checks = document.querySelectorAll(".turno-check:checked");

    try {
        for (const check of checks) {
            const turno = turnosGlobal[check.value];
            const res = await fetch(BASE_TURNOS, {
                method: "PUT",
                headers: {
                    "Authorization": "Basic " + auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(turno)
            });

            if (!res.ok) throw new Error();
        }

        alert("Turnos actualizados");
        cargarTurnos();

    } catch {
        alert("Error actualizando turnos");
    }
}

// FICHAJES
async function cargarFichajes() {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${usuario.idEmpleado}`, {
            headers: { "Authorization": "Basic " + auth }
        });

        const fichajes = await res.json();
        const tbody = document.getElementById("tablaFichajesBody");
        tbody.innerHTML = "";
        let totalMinutos = 0;
        const mapa = {};

        fichajes.forEach(f => {
            const fechaObj = new Date(f.fechaHora || f.fecha_hora);

            //FILTRAR MES ACTUAL
            if (!esDelMesActual(fechaObj)) return;

            const fecha = soloFechaISO(fechaObj);

            if (!mapa[fecha]) mapa[fecha] = { entrada: null, salida: null };
            if (f.tipo === "ENTRADA") mapa[fecha].entrada = fechaObj;
            if (f.tipo === "SALIDA") mapa[fecha].salida = fechaObj;
        });

        Object.keys(mapa).forEach(fecha => {
            let entrada = mapa[fecha].entrada;
            let salida = mapa[fecha].salida;
            let horas = "--";
            let clase = "rojo";

            if (entrada && salida) {
                let min = Math.floor((salida - entrada) / 60000);
                totalMinutos += min;

                horas = `${Math.floor(min / 60)}h ${min % 60}m`;
                clase = "verde";
            }

            tbody.innerHTML += `
                <tr class="${clase}">
                    <td>${fecha}</td>
                    <td>${entrada ? entrada.toLocaleTimeString() : "-"}</td>
                    <td>${salida ? salida.toLocaleTimeString() : "-"}</td>
                    <td>${horas}</td>
                </tr>
            `;
        });

        document.getElementById("totalHoras").textContent =
            `${Math.floor(totalMinutos / 60)}h ${totalMinutos % 60}m`;

    } catch {
        alert("Error al cargar fichajes");
    }
}

cargarInfoUsuario();
cargarTurnos();
cargarFichajes();