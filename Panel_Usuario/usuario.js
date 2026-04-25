const BASE_FICHAJES = "http://localhost:8080/fichaje";
const BASE_TURNOS = "http://localhost:8080/turno";

const usuario = JSON.parse(localStorage.getItem("usuario"));

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nombreHeader").textContent = usuario.nombre;
});

if (!usuario) {
    window.location.href = "login.html";
}

document.getElementById("uId").textContent = usuario.idEmpleado;
document.getElementById("uNombre").textContent = usuario.nombre;
document.getElementById("uApellidos").textContent = usuario.apellidos;
document.getElementById("uEmail").textContent = usuario.email;
document.getElementById("uRol").textContent = usuario.rol;


//Cargar Fichajes
async function cargarFichajes() {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${usuario.idEmpleado}`);
        const fichajes = await res.json();

        const tbody = document.getElementById("tablaFichajesUsuario");
        tbody.innerHTML = "";

        const mapa = {};

        const hoy = new Date().toLocaleDateString();
        let entradaHoy = "--:--";
        let salidaHoy = "--:--";

        fichajes.forEach(f => {
            const fechaObj = new Date(f.fechaHora);
            const fecha = fechaObj.toLocaleDateString();
            const hora = fechaObj.toLocaleTimeString();

            if (!mapa[fecha]) {
                mapa[fecha] = { entrada: "-", salida: "-" };
            }

            if (f.tipo === "ENTRADA") {
                mapa[fecha].entrada = hora;

                if (fecha === hoy) {
                    entradaHoy = hora;
                }
            }

            if (f.tipo === "SALIDA") {
                mapa[fecha].salida = hora;

                if (fecha === hoy) {
                    salidaHoy = hora;
                }
            }
        });

        Object.keys(mapa).forEach(fecha => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${mapa[fecha].entrada}</td>
                <td>${mapa[fecha].salida}</td>
            `;

            tbody.appendChild(tr);
        });

        document.getElementById("horaEntradaHoy").textContent = entradaHoy;
        document.getElementById("horaSalidaHoy").textContent = salidaHoy;

    } catch (err) {
        console.error(err);
    }
}

cargarFichajes();


//turnos

let turnoHoy = null;

async function cargarTurnos() {
    try {
        const res = await fetch(`${BASE_TURNOS}/empleado/${usuario.idEmpleado}`);
        const turnos = await res.json();

        const tbody = document.getElementById("tablaTurnosUsuario");
        tbody.innerHTML = "";

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const dosSemanas = new Date(hoy);
        dosSemanas.setDate(hoy.getDate() + 14);

        turnoHoy = null;

        turnos.forEach(t => {
            const fechaInicio = new Date(t.fechaInicio);
            fechaInicio.setHours(0, 0, 0, 0);

            if (fechaInicio >= hoy && fechaInicio <= dosSemanas) {

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${t.tipoTurno}</td>
                    <td>${t.fechaInicio}</td>
                    <td>${t.fechaFin}</td>
                `;

                if (fechaInicio.getTime() === hoy.getTime()) {
                    turnoHoy = t;
                    tr.style.backgroundColor = "#d4edda";
                }

                tbody.appendChild(tr);
            }
        });

    } catch (err) {
        console.error(err);
    }
}

cargarTurnos();


// Fichar
async function controlarBotonesFichaje() {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${usuario.idEmpleado}`);
        const fichajes = await res.json();

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let entrada = false;
        let salida = false;

        fichajes.forEach(f => {
            const fecha = new Date(f.fechaHora);
            fecha.setHours(0, 0, 0, 0);

            if (fecha.getTime() === hoy.getTime()) {
                if (f.tipo === "ENTRADA") entrada = true;
                if (f.tipo === "SALIDA") salida = true;
            }
        });

        const btnEntrada = document.getElementById("btnEntrada");
        const btnSalida = document.getElementById("btnSalida");

        // NUEVO: si no hay turno hoy → ambos deshabilitados
        if (!turnoHoy) {
            btnEntrada.disabled = true;
            btnSalida.disabled = true;
            return;
        }

        // lógica normal
        if (!entrada) {
            btnEntrada.disabled = false;
            btnSalida.disabled = true;
        } 
        else if (entrada && !salida) {
            btnEntrada.disabled = true;
            btnSalida.disabled = false;
        } 
        else {
            btnEntrada.disabled = true;
            btnSalida.disabled = true;
        }

    } catch (err) {
        console.error(err);
    }
}

async function fichar(tipo) {

    // Si no hay turno hoy → no puede fichar
    if (!turnoHoy) {
        alert("No tienes turno asignado hoy");
        return;
    }

    const ahora = new Date();

    const inicioTurno = new Date(
        turnoHoy.fechaInicio.replace(" ", "T")
    );

    const finTurno = new Date(
        turnoHoy.fechaFin.replace(" ", "T")
    );


    // ---------------- ENTRADA ----------------
    if (tipo === "ENTRADA") {

        // Si entra después de la hora del turno → incidencia
        if (ahora.getTime() > inicioTurno.getTime()) {
            document.getElementById("modalIncidencia").style.display = "block";
            window.fichajePendiente = { tipo };
            return;
        }

        // Si entra antes o justo a la hora → permitir
        await enviarFichaje(tipo);
    }


    // ---------------- SALIDA ----------------
    if (tipo === "SALIDA") {

        // Si sale antes → permitir igualmente
        if (ahora.getTime() < finTurno.getTime()) {
            await enviarFichaje(tipo);
            return;
        }

        // Si sale después → también permitir
        await enviarFichaje(tipo);
    }
}

async function enviarFichaje(tipo, descripcion = null) {
    try {
        const res = await fetch(BASE_FICHAJES, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tipo: tipo,
                idEmpleado: usuario.idEmpleado,
                idTurno: turnoHoy.idTurno,
                fechaHora: new Date().toISOString()
            })
        });

        if (!res.ok) throw new Error("Error al fichar");

        cargarFichajes();
        controlarBotonesFichaje();

    } catch (err) {
        console.error(err);
    }
}



//incidencias

async function confirmarIncidencia() {

    const motivo = document.getElementById("motivoRetraso").value;

    await enviarFichaje("ENTRADA");

    const incidencia = {
        idEmpleado: usuario.idEmpleado,
        fecha: new Date().toISOString(),
        tipo: "RETRASO",
        descripcion: motivo === "OTRO"
            ? document.getElementById("descripcionExtra").value
            : motivo
    };

    const res = await fetch("http://localhost:8080/incidencias", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(incidencia)
    });

    if (!res.ok) {
        const error = await res.text();
        console.error(error);
        alert("Error al guardar incidencia");
        return;
    }

    document.getElementById("modalIncidencia").style.display = "none";

    cargarFichajes();
    controlarBotonesFichaje();
}


function mostrarDescripcion() {
    const motivo = document.getElementById("motivoRetraso").value;
    const textarea = document.getElementById("descripcionExtra");

    if (motivo === "OTRO") {
        textarea.style.display = "block";
    } else {
        textarea.style.display = "none";
        textarea.value = "";
    }
}

controlarBotonesFichaje();

// Salir
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}