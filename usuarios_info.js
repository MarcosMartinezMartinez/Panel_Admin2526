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



// CARGAR TURNOS
async function cargarTurnos() {
    try {
        const res = await fetch(
            `${BASE_TURNOS}/empleado/${usuario.idEmpleado}`,
            {
                headers: {
                    "Authorization": "Basic " + auth
                }
            }
        );

        if (!res.ok) throw new Error("Error al cargar turnos");
        turnosGlobal = await res.json();
        const tbody = document.getElementById("tablaTurnosBody");
        tbody.innerHTML = "";

        if (turnosGlobal.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">No hay turnos asignados</td>
                </tr>
            `;
            return;
        }

        turnosGlobal.forEach((t, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>
                        <input 
                            type="checkbox" 
                            class="turno-check" 
                            value="${index}">
                    </td>
                    <td>${t.tipoTurno}</td>
                    <td>${t.fechaInicio}</td>
                    <td>${t.fechaFin}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        alert("Error al cargar turnos");
    }
}

// EDITAR TURNOS SELECCIONADOS
function editarTurnosSeleccionados() {
    const checks = document.querySelectorAll(".turno-check:checked");

    if (checks.length === 0) {
        alert("Selecciona al menos un turno");
        return;
    }

    // OFICINA
    if (usuario.tipoPuesto === "OFICINA") {
        let nuevaHoraInicio = "";
        let nuevaHoraFin = "";

        while (true) {
            nuevaHoraInicio = prompt("Nueva hora inicio (HH:mm)");
            if (!nuevaHoraInicio) return;

            if (esHoraValida(nuevaHoraInicio)) break;
            alert("Hora inválida. Usa formato 00:00 - 23:59");
        }

        while (true) {
            nuevaHoraFin = prompt("Nueva hora fin (HH:mm)");
            if (!nuevaHoraFin) return;

            if (esHoraValida(nuevaHoraFin)) break;
            alert("Hora inválida. Usa formato 00:00 - 23:59");
        }

        checks.forEach(check => {
            const index = check.value;
            const turno = turnosGlobal[index];
            const fechaInicioOriginal = turno.fechaInicio.split(" ")[0];
            const fechaFinOriginal = turno.fechaFin.split(" ")[0];
            turno.fechaInicio = `${fechaInicioOriginal} ${nuevaHoraInicio}:00`;
            turno.fechaFin = `${fechaFinOriginal} ${nuevaHoraFin}:00`;
        });
    }

    // PRODUCCIÓN
    else if (usuario.tipoPuesto === "PRODUCCIÓN") {
        let nuevoTipo = "";

        while (true) {
            nuevoTipo = prompt("Tipo turno (MAÑANA / TARDE / NOCHE)");

            if (!nuevoTipo) return;
            nuevoTipo = nuevoTipo.toUpperCase().trim();

            if (
                nuevoTipo === "MAÑANA" || nuevoTipo === "TARDE" || nuevoTipo === "NOCHE"
            ) {
                break;
            }
            alert("Solo: MAÑANA, TARDE o NOCHE");
        }

        let nuevaHoraInicio = "";
        let nuevaHoraFin = "";
        while (true) {
            nuevaHoraInicio = prompt("Nueva hora inicio (HH:mm)");
            if (!nuevaHoraInicio) return;

            if (esHoraValida(nuevaHoraInicio)) break;
            alert("Hora inválida");
        }

        while (true) {
            nuevaHoraFin = prompt("Nueva hora fin (HH:mm)");
            if (!nuevaHoraFin) return;

            if (esHoraValida(nuevaHoraFin)) break;
            alert("Hora inválida");
        }

        checks.forEach(check => {
            const index = check.value;
            const turno = turnosGlobal[index];
            const fechaInicioOriginal = turno.fechaInicio.split(" ")[0];
            const fechaFinOriginal = turno.fechaFin.split(" ")[0];
            turno.tipoTurno = nuevoTipo;
            turno.fechaInicio = `${fechaInicioOriginal} ${nuevaHoraInicio}:00`;
            turno.fechaFin = `${fechaFinOriginal} ${nuevaHoraFin}:00`;
        });
    }

    actualizarTurnos();
}



// ACTUALIZAR BACKEND
async function actualizarTurnos() {
    try {
        const checks = document.querySelectorAll(".turno-check:checked");

        for (const check of checks) {
            const index = check.value;
            const turno = turnosGlobal[index];
            const res = await fetch(BASE_TURNOS, {
                method: "PUT",
                headers: {
                    "Authorization": "Basic " + auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(turno)
            });

            if (!res.ok) {
                throw new Error("Error al actualizar turno");
            }
        }

        alert("Turnos actualizados correctamente");
        cargarTurnos();

    } catch (err) {
        console.error(err);
        alert("Error actualizando turnos");
    }
}

// CARGAR FICHAJES
async function cargarFichajes() {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();

    try {
        const res = await fetch(
            `${BASE_FICHAJES}/empleado/${usuario.idEmpleado}`,
            {
                headers: {
                    "Authorization": "Basic " + auth
                }
            }
        );

        if (!res.ok) throw new Error("Error al cargar fichajes");

        const fichajes = await res.json();
        const tbody = document.getElementById("tablaFichajesBody");
        tbody.innerHTML = "";
        const mapa = {};
        let totalMinutos = 0;

        fichajes.forEach(f => {
            let fechaObj = new Date(f.fechaHora || f.fecha_hora);

            if (isNaN(fechaObj)) return;

            if (
                fechaObj.getMonth() !== mesActual ||
                fechaObj.getFullYear() !== añoActual
            ) {
                return;
            }

            const fecha = soloFechaISO(fechaObj);

            if (!mapa[fecha]) {
                mapa[fecha] = { entrada: null, salida: null };
            }

            if (f.tipo === "ENTRADA") {
                mapa[fecha].entrada = fechaObj;
            }

            if (f.tipo === "SALIDA") {
                mapa[fecha].salida = fechaObj;
            }
        });

        Object.keys(mapa).forEach(fecha => {

            let horasDia = "--";
            let entradaTexto = "-";
            let salidaTexto = "-";
            let claseColor = "rojo";

            if (mapa[fecha].entrada) {
                entradaTexto = mapa[fecha].entrada.toLocaleTimeString();
            }

            if (mapa[fecha].salida) {
                salidaTexto = mapa[fecha].salida.toLocaleTimeString();
            }

            if (mapa[fecha].entrada && mapa[fecha].salida) {
                const diffMs = mapa[fecha].salida - mapa[fecha].entrada;
                let diffMin = Math.floor(diffMs / 60000);

                if (usuario.tipoPuesto === "OFICINA" && diffMin > 480) {
                    diffMin -= 90;
                }

                const h = Math.floor(diffMin / 60);
                const m = diffMin % 60;
                horasDia = `${h}h ${m}m`;
                totalMinutos += diffMin;
                claseColor = "verde";
            }

            tbody.innerHTML += `
                <tr class="${claseColor}">
                    <td>${fecha}</td>
                    <td>${entradaTexto}</td>
                    <td>${salidaTexto}</td>
                    <td>${horasDia}</td>
                </tr>
            `;
        });

        const totalHoras = Math.floor(totalMinutos / 60);
        const totalMin = totalMinutos % 60;

        document.getElementById("totalHoras").textContent =
            `${totalHoras}h ${totalMin}m`;

    } catch (err) {
        console.error(err);
        alert("Error al cargar fichajes");
    }
}

cargarInfoUsuario();
cargarTurnos();
cargarFichajes();