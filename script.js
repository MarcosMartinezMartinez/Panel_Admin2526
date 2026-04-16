const BASE_URL = "http://localhost:8080/usuario";
const BASE_TURNOS = "http://localhost:8080/turno";
const BASE_FICHAJES = "http://localhost:8080/fichaje";

// Credenciales HTTP Basic
const USUARIO = "admin";
const PASSWORD = "admin";

let usuarioEditando = null;

// --- OBTENER USUARIOS ---
async function obtenerUsuarios() {
    try {
        const res = await fetch(BASE_URL, {
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`)
            }
        });

        if (!res.ok) throw new Error("Error al obtener usuarios");

        const usuarios = await res.json();
        const tbody = document.querySelector("#tablaUsuarios tbody");
        tbody.innerHTML = "";

        usuarios.forEach(u => {
            const tr = document.createElement("tr");

            tr.style.cursor = "pointer";
            tr.onclick = () => verTurnos(u.idEmpleado);

            tr.innerHTML = `
                <td>${u.idEmpleado}</td>
                <td>${u.nombre}</td>
                <td>${u.apellidos}</td>
                <td>${u.email}</td>
                <td>${u.rol}</td>
                <td>${u.activo ? "Sí" : "No"}</td>
                <td>
                    <a href="#" class="btn editar" onclick="event.stopPropagation(); abrirEditar(${u.idEmpleado})">
                        <span class="material-symbols-outlined">edit</span>Editar
                    </a>
                    <a href="#" class="btn eliminar" onclick="event.stopPropagation(); eliminarUsuario(${u.idEmpleado})">
                        <span class="material-symbols-outlined">delete</span>Eliminar
                    </a>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        alert("No se pudieron cargar los usuarios.");
    }
}

// --- VER TURNOS ---
async function verTurnos(idEmpleado) {
    try {
        const res = await fetch(`${BASE_TURNOS}/empleado/${idEmpleado}`, {
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`)
            }
        });

        if (!res.ok) throw new Error("Error al obtener turnos");

        const turnos = await res.json();
        const tbody = document.getElementById("tablaTurnosBody");
        tbody.innerHTML = "";

        if (!turnos || turnos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">No hay turnos</td></tr>`;
            document.getElementById("modalTurnos").style.display = "block";
            return;
        }

        turnos.forEach(t => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${t.tipoTurno}</td>
                <td>${t.fechaInicio}</td>
                <td>${t.fechaFin}</td>
            `;

            tbody.appendChild(tr);
        });

        verFichajes(idEmpleado);
        document.getElementById("modalTurnos").style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Error al cargar turnos");
    }
}

// --- CERRAR MODAL TURNOS ---
function cerrarModalTurnos() {
    document.getElementById("modalTurnos").style.display = "none";
}

// --- ELIMINAR USUARIO ---
async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
        const res = await fetch(`${BASE_URL}/id/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`)
            }
        });

        if (!res.ok) throw new Error("Error al eliminar");

        obtenerUsuarios();

    } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el usuario.");
    }
}

// --- MODAL USUARIO ---
const modal = document.getElementById("modalUsuario");
const btnNuevo = document.getElementById("btnNuevo");
const spanClose = document.querySelector(".close");
const btnCancelar = document.querySelector(".cancelar");
const form = document.getElementById("formNuevoUsuario");

btnNuevo.onclick = () => {
    usuarioEditando = null;
    form.reset();
    modal.style.display = "block";
};

spanClose.onclick = cerrarModal;
btnCancelar.onclick = cerrarModal;

function cerrarModal() {
    form.reset();
    modal.style.display = "none";
    usuarioEditando = null;
}

// --- CREAR / EDITAR ---
form.onsubmit = async (e) => {
    e.preventDefault();

    const usuario = {
        nombre: document.getElementById("nombre").value,
        apellidos: document.getElementById("apellidos").value,
        email: document.getElementById("email").value,
        contraseña: document.getElementById("contraseña").value,
        rol: document.getElementById("rol").value,
        tipoPuesto: document.getElementById("tipoPuesto").value,
        activo: document.getElementById("activo").checked
    };

    let metodo = "POST";

    if (usuarioEditando) {
        usuario.idEmpleado = usuarioEditando.idEmpleado;
        usuario.fechaAlta = usuarioEditando.fechaAlta;
        metodo = "PUT";
    } else {
        usuario.fechaAlta = new Date().toISOString().split('T')[0];
    }

    try {
        const res = await fetch(BASE_URL, {
            method: metodo,
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        });

        if (!res.ok) throw new Error("Error al guardar");

        obtenerUsuarios();
        cerrarModal();

    } catch (err) {
        console.error(err);
        alert("Error al guardar usuario");
    }
};

// --- EDITAR ---
async function abrirEditar(id) {
    try {
        const res = await fetch(`${BASE_URL}/id/${id}`, {
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`)
            }
        });

        const u = await res.json();
        usuarioEditando = u;

        document.getElementById("nombre").value = u.nombre;
        document.getElementById("apellidos").value = u.apellidos;
        document.getElementById("email").value = u.email;
        document.getElementById("contraseña").value = "F1234";
        document.getElementById("rol").value = u.rol;
        document.getElementById("tipoPuesto").value = u.tipoPuesto;
        document.getElementById("activo").checked = u.activo;

        modal.style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Error al cargar usuario");
    }
}

// --- PASSWORD TOGGLE ---
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("contraseña");

togglePassword.addEventListener("click", () => {
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

// --- FICHAJES (CORREGIDO) ---
async function verFichajes(idEmpleado) {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${idEmpleado}`, {
            headers: {
                "Authorization": "Basic " + btoa(`${USUARIO}:${PASSWORD}`)
            }
        });

        if (!res.ok) throw new Error("Error al obtener fichajes");

        const fichajes = await res.json();
console.log("FICHAJES RECIBIDOS:", fichajes);
        const tbody = document.getElementById("tablaFichajesBody");
        tbody.innerHTML = "";

        const mapa = {};

        fichajes.forEach(f => {

            let fechaRaw = f.fechaHora || f.fecha_hora;

            if (!fechaRaw) return;

            // soporta "10,04,2026"
            let fechaObj;

            if (typeof fechaRaw === "string" && fechaRaw.includes(",")) {
                const partes = fechaRaw.split(",");

                fechaObj = new Date(
                    partes[2],
                    partes[1] - 1,
                    partes[0]
                );
            } else {
                fechaObj = new Date(fechaRaw);
            }

            if (isNaN(fechaObj)) return;

            const fecha = fechaObj.toLocaleDateString();

            if (!mapa[fecha]) {
                mapa[fecha] = { entrada: "-", salida: "-" };
            }

            const hora = fechaObj.toLocaleTimeString();

            if (f.tipo === "ENTRADA") {
                mapa[fecha].entrada = hora;
            }

            if (f.tipo === "SALIDA") {
                mapa[fecha].salida = hora;
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

    } catch (err) {
        console.error(err);
        alert("Error al cargar fichajes");
    }
}

// INIT
window.onload = obtenerUsuarios;