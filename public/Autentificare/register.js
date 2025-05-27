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
            alert("Cont creat cu succes! Te poți autentifica acum.");
            window.location.href = "login.html";
        } else {
            errorElement.textContent = result.error || "Eroare necunoscută.";
        }
    });
}
