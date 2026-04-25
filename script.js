const usuarioSesion = JSON.parse(localStorage.getItem("usuario"));
const auth = localStorage.getItem("auth");

if (!usuarioSesion || usuarioSesion.rol !== "ADMIN" || !auth) {
    window.location.href = "/Login/login.html";
}

const BASE_URL = "http://localhost:8080/usuario";
let usuarioEditando = null;
let listaUsuarios = [];

window.addEventListener("DOMContentLoaded", () => {
    obtenerUsuarios();
    configurarFormulario();
    configurarModal();

    document.getElementById("buscadorUsuarios").addEventListener("input", function () {

        const texto = this.value.toLowerCase().trim();
        const filtrados = listaUsuarios.filter(u =>
            u.nombre.toLowerCase().includes(texto) ||
            u.apellidos.toLowerCase().includes(texto) ||
            u.email.toLowerCase().includes(texto)
        );

        renderUsuarios(filtrados);
    });
});

// LISTAR USUARIOS
async function obtenerUsuarios() {
    try {
        const res = await fetch(BASE_URL, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

        listaUsuarios = await res.json();

        renderUsuarios(listaUsuarios);

    } catch (err) {
        console.error(err);
        alert("No se pudieron cargar los usuarios.");
    }
}
function renderUsuarios(usuarios) {

    const tbody = document.querySelector("#tablaUsuarios tbody");
    tbody.innerHTML = "";

    usuarios.forEach(u => {

        const tr = document.createElement("tr");

        tr.style.cursor = "pointer";
        tr.onclick = () => {
            localStorage.setItem("usuarioSeleccionado", JSON.stringify(u));
            window.location.href = "usuarios_info.html";
        };

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
}
document.getElementById("btnLimpiarBusqueda").addEventListener("click", function () {
    const input = document.getElementById("buscadorUsuarios");
    input.value = "";
    renderUsuarios(listaUsuarios);
});

// MODAL
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

function cerrarModal() {
    document.getElementById("modalUsuario").style.display = "none";
    document.getElementById("formNuevoUsuario").reset();
    usuarioEditando = null;
}

// CREAR / EDITAR
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

        if (pass.trim() !== "") {
            usuario.contraseña = pass;
        }

        let url = BASE_URL;
        let metodo = "POST";

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

// EDITAR
async function abrirEditar(id) {
    try {
        const res = await fetch(`${BASE_URL}/id/${id}`, {
            headers: {
                "Authorization": "Basic " + auth
            }
        });

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

// ELIMINAR
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

// Salir
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}