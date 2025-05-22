// =======================
// LOGIN
// =======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = e.target.username.value.trim();
        const password = e.target.password.value.trim();

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await res.json();

        if (res.ok) {
            // ✅ Salvăm tokenul JWT în localStorage
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", username);
            window.location.href = "/Homepage/homepage.html";
        } else {
            document.getElementById("error").textContent = result.error;
        }
    });
}


const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = e.target.username.value.trim();
        const password = e.target.password.value.trim();
        const confirm = e.target.confirm.value.trim();

        const errorElement = document.getElementById("register-error");
        errorElement.textContent = "";

        if (password !== confirm) {
            errorElement.textContent = "Parolele nu coincid.";
            return;
        }

        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await res.json();

        if (res.ok) {
            alert("Cont creat cu succes! Poți să te autentifici acum.");
            window.location.href = "login.html";
        } else {
            errorElement.textContent = result.error;
        }
    });
}

