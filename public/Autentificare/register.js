const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = e.target.username.value.trim();
        const password = e.target.password.value.trim();
        const confirm = e.target.confirm.value.trim();
        const errorElement = document.getElementById("register-error");
        const successElement = document.getElementById("register-success");

        errorElement.textContent = "";
        successElement.textContent = "";

        // Validare simplă
        if (!username || !password || !confirm) {
            errorElement.textContent = "Completează toate câmpurile.";
            return;
        }

        if (password.length < 4) {
            errorElement.textContent = "Parola trebuie să aibă cel puțin 4 caractere.";
            return;
        }

        if (password !== confirm) {
            errorElement.textContent = "Parolele nu coincid.";
            return;
        }

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();

            if (res.ok) {
                registerForm.reset();
                successElement.textContent = " Cont creat cu succes! Te poți autentifica acum.";
            } else {
                errorElement.textContent = result.error || "Eroare necunoscută.";
            }
        } catch (err) {
            console.error("Eroare la înregistrare:", err);
            errorElement.textContent = "Nu s-a putut conecta la server.";
        }
    });
}
