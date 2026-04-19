const BASE_FICHAJES = "http://localhost:8080/fichaje";

const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {
    window.location.href = "login.html";
}

// Cargar datos
document.getElementById("uId").textContent = usuario.idEmpleado;
document.getElementById("uNombre").textContent = usuario.nombre;
document.getElementById("uApellidos").textContent = usuario.apellidos;
document.getElementById("uEmail").textContent = usuario.email;
document.getElementById("uRol").textContent = usuario.rol;

// Cargar fichajes
async function cargarFichajes() {
    try {
        const res = await fetch(`${BASE_FICHAJES}/empleado/${usuario.idEmpleado}`);

        const fichajes = await res.json();

        const tbody = document.getElementById("tablaFichajesUsuario");
        tbody.innerHTML = "";

        const mapa = {};

        fichajes.forEach(f => {
            const fechaObj = new Date(f.fechaHora);
            const fecha = fechaObj.toLocaleDateString();

            if (!mapa[fecha]) {
                mapa[fecha] = { entrada: "-", salida: "-" };
            }

            const hora = fechaObj.toLocaleTimeString();

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
    }
}

cargarFichajes();

// Logout
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "../Login/login.html";
}