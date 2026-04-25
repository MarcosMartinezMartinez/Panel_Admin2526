// Recuperación de datos de sesión desde localStorage
const usuarioSesion = JSON.parse(localStorage.getItem("usuario"));
const auth = localStorage.getItem("auth");

// Control de acceso: solo usuarios con rol ADMIN pueden continuar
if (!usuarioSesion || usuarioSesion.rol !== "ADMIN" || !auth) {
    window.location.href = "/Login/login.html";
}

// URLs base de la API
const BASE_URL = "http://localhost:8080/usuario";
const BASE_TURNOS = "http://localhost:8080/turno";
const BASE_FICHAJES = "http://localhost:8080/fichaje";

// Variable global para controlar si se está editando un usuario
let usuarioEditando = null;

// Inicialización cuando el DOM está cargado
window.addEventListener("DOMContentLoaded", () => {
    obtenerUsuarios();
    configurarFormulario();
    configurarModal();
});


// Obtener lista de usuarios desde el backend
async function obtenerUsuarios() {
    try {
        const res = await fetch(BASE_URL, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        if (!res.ok) throw new Error("Error al obtener usuarios");

        const usuarios = await res.json();

        const tbody = document.querySelector("#tablaUsuarios tbody");
        tbody.innerHTML = "";

        usuarios.forEach(u => {
            const tr = document.createElement("tr");

            // Permite abrir turnos al hacer clic en la fila
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
                    <a href="#" class="btn editar"
                       onclick="event.stopPropagation(); abrirEditar(${u.idEmpleado})">
                        Editar
                    </a>
                    <a href="#" class="btn eliminar"
                       onclick="event.stopPropagation(); eliminarUsuario(${u.idEmpleado})">
                        Eliminar
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


// Configuración del formulario de creación y edición
function configurarFormulario() {
    const form = document.getElementById("formNuevoUsuario");

    form.onsubmit = async (e) => {
        e.preventDefault();

        const pass = document.getElementById("contraseña").value;

        const usuario = {
            nombre: document.getElementById("nombre").value,
            apellidos: document.getElementById("apellidos").value,
            email: document.getElementById("email").value,
            rol: document.getElementById("rol").value,
            tipoPuesto: document.getElementById("tipoPuesto").value,
            activo: document.getElementById("activo").checked,
            fechaAlta: new Date().toISOString().split('T')[0]
        };

        // La contraseña solo se envía si el usuario la introduce
        if (pass.trim() !== "") {
            usuario.contraseña = pass;
        }

        let url = BASE_URL;
        let metodo = "POST";

        // Modo edición
        if (usuarioEditando) {
            url = `${BASE_URL}/${usuarioEditando.idEmpleado}`;
            metodo = "PUT";

            usuario.idEmpleado = usuarioEditando.idEmpleado;
            usuario.fechaAlta = usuarioEditando.fechaAlta;
        }

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: {
                    "Authorization": "Basic " + auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuario)
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            obtenerUsuarios();
            cerrarModal();

        } catch (err) {
            console.error(err);
            alert("Error al guardar usuario");
        }
    };
}


// Configuración del modal de usuarios
function configurarModal() {
    const modal = document.getElementById("modalUsuario");
    const btnNuevo = document.getElementById("btnNuevo");
    const close = document.querySelector(".close");
    const cancelar = document.querySelector(".cancelar");

    btnNuevo.onclick = () => {
        usuarioEditando = null;
        document.getElementById("formNuevoUsuario").reset();
        modal.style.display = "block";
    };

    close.onclick = cerrarModal;
    cancelar.onclick = cerrarModal;
}

// Cierra el modal y limpia el formulario
function cerrarModal() {
    document.getElementById("modalUsuario").style.display = "none";
    document.getElementById("formNuevoUsuario").reset();
    usuarioEditando = null;
}


// Cargar datos de un usuario en el formulario para editar
async function abrirEditar(id) {
    try {
        const res = await fetch(`${BASE_URL}/id/${id}`, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        if (!res.ok) throw new Error("Error al obtener usuario");

        const u = await res.json();
        usuarioEditando = u;

        document.getElementById("nombre").value = u.nombre;
        document.getElementById("apellidos").value = u.apellidos;
        document.getElementById("email").value = u.email;
        document.getElementById("contraseña").value = "";
        document.getElementById("rol").value = u.rol;
        document.getElementById("tipoPuesto").value = u.tipoPuesto;
        document.getElementById("activo").checked = u.activo;

        document.getElementById("modalUsuario").style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Error al cargar usuario");
    }
}


// Eliminar usuario por ID
async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
        const res = await fetch(`${BASE_URL}/id/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        if (!res.ok) throw new Error("Error al eliminar");

        obtenerUsuarios();

    } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el usuario.");
    }
}


// Obtener turnos de un empleado
async function verTurnos(idEmpleado) {
    try {
        const res = await fetch(`${BASE_TURNOS}/empleado/${idEmpleado}`, {
            headers: {
                "Authorization": "Basic " + auth
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


// Cerrar modal de turnos
function cerrarModalTurnos() {
    document.getElementById("modalTurnos").style.display = "none";
}


// Obtener fichajes agrupados por día
async function verFichajes(idEmpleado) {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${idEmpleado}`, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        if (!res.ok) throw new Error("Error al obtener fichajes");

        const fichajes = await res.json();

        const tbody = document.getElementById("tablaFichajesBody");
        tbody.innerHTML = "";

        const mapa = {};

        fichajes.forEach(f => {
            let fechaObj = new Date(f.fechaHora || f.fecha_hora);
            if (isNaN(fechaObj)) return;

            const fecha = fechaObj.toLocaleDateString();
            const hora = fechaObj.toLocaleTimeString();

            if (!mapa[fecha]) {
                mapa[fecha] = { entrada: "-", salida: "-" };
            }

            if (f.tipo === "ENTRADA") mapa[fecha].entrada = hora;
            if (f.tipo === "SALIDA") mapa[fecha].salida = hora;
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