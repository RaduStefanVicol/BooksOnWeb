document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Verificare autentificare
    if (!user) {
        window.location.href = "/Autentificare/login.html";
    }

    // Verificare rol admin
    if (user !== "admin") {
        window.location.href = "/Homepage/homepage.html";
    }

    // Logout
    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/Autentificare/login.html";
    });

    const form = document.getElementById("addBookForm");
    const list = document.getElementById("bookList");

    // Încărcare cărți
    function loadBooks() {
        fetch("/api/books")
            .then(res => res.json())
            .then(books => {
                list.innerHTML = "";
                books.reverse().forEach(book => {
                    const card = document.createElement("div");
                    card.className = "book-card";
                    card.innerHTML = `
                        <strong>${book.title}</strong>
                        <span>de ${book.author} (${book.year})</span><br>
                        <em>${book.category}</em>`;
                    list.appendChild(card);
                });
            });
    }

    // Adăugare carte nouă
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const book = {
            title: form.title.value,
            author: form.author.value,
            year: parseInt(form.year.value),
            category: form.category.value
        };

        await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(book)
        });

        form.reset();
        loadBooks();
    });

    loadBooks();
});
