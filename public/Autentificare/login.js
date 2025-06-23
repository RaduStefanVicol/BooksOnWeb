const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = e.target.username.value.trim();
        const password = e.target.password.value.trim();
        const errorBox = document.getElementById("error");

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();

            if (res.ok) {
                localStorage.removeItem("username");

                localStorage.setItem("token", result.token);
                localStorage.setItem("user", username);
                if (username === "admin") {
                    window.location.href = "/Administrator/pagAdmin.html";
                } else {
                    window.location.href = "/Homepage/homepage.html";
                }
            } else {
                if (errorBox) {
                    errorBox.textContent = result.error || "Eroare necunoscută.";
                } else {
                    alert(result.error || "Eroare necunoscută.");
                }
            }
        } catch (err) {
            console.error("Eroare la conectare:", err);
            if (errorBox) {
                errorBox.textContent = "Nu s-a putut conecta la server.";
            }
        }
    });
}
