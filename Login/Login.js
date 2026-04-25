document.getElementById("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const res = await fetch("http://localhost:8080/usuario/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                contraseña: password
            })
        });

        if (!res.ok) throw new Error("Login incorrecto");

        const usuario = await res.json();

        localStorage.setItem("usuario", JSON.stringify(usuario));

        // Dirección por rol
        if (usuario.rol === "ADMIN") {
            window.location.href = "../index.html";
        } else {
            window.location.href = "../Panel_Usuario/usuario.html";
        }

    } catch (err) {
        alert("Usuario o contraseña incorrectos");
    }
});