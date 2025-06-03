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
        const errorBox = document.getElementById("error");

        if (res.ok) {
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", username);

            // 👇 verificăm dacă e admin
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
    });
}
