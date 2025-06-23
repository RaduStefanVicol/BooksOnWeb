document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!user) {
        window.location.href = "/Autentificare/login.html";
    }


    if (user !== "admin") {
        window.location.href = "/Homepage/homepage.html";
    }

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/Autentificare/login.html";
    });

    const form = document.getElementById("addBookForm");
    const list = document.getElementById("bookList");

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
                        <em>${book.category}</em><br>
                        <div>Editura: ${book.publisher || "Nespecificată"}</div>
                        <div>Ediție: ${book.edition || "-"}</div>
                        <div>${book.related && book.related.length ? `<em>Cărți înrudite:</em> ${book.related.join(", ")}` : ""}</div>
                    `;
                    list.appendChild(card);
                });
            });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const book = {
            title: form.title.value,
            author: form.author.value,
            year: parseInt(form.year.value),
            category: form.category.value,
            publisher: form.publisher.value,
            edition: form.edition.value,
            related: form.related.value.split(",").map(s => s.trim()).filter(Boolean)
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
