document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!user) {
        window.location.href = "/Autentificare/login.html";
    }

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/Autentificare/login.html";
    });

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
                        <strong>${book.title}</strong><br>
                        <span>de ${book.author} (${book.year})</span><br>
                        <em>${book.category}</em>`;
                    list.appendChild(card);
                });
            });
    }

    // Google Books API Search
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const googleResults = document.getElementById("googleResults");

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        googleResults.innerHTML = "<p>Se caută...</p>";

        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}`);
            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                googleResults.innerHTML = "<p>Nu am găsit cărți.</p>";
                return;
            }

            googleResults.innerHTML = "";
            data.items.forEach(item => {
                const volume = item.volumeInfo;
                const thumbnail = volume.imageLinks?.thumbnail || "https://via.placeholder.com/100x150?text=Fără+copertă";

                const card = document.createElement("div");
                card.className = "book-card";
                card.innerHTML = `
                    <img src="${thumbnail}" alt="Coperta" style="width:100px; height:auto; margin-bottom:8px;"><br>
                    <strong>${volume.title || "Fără titlu"}</strong><br>
                    <span>${volume.authors ? volume.authors.join(", ") : "Autor necunoscut"}</span><br>
                    <em>${volume.publishedDate || "An necunoscut"}</em><br>
                    <p>${volume.description ? volume.description.substring(0, 150) + "..." : "Fără descriere"}</p>
                `;
                googleResults.appendChild(card);
            });
        } catch (err) {
            googleResults.innerHTML = "<p>Eroare la conectarea cu Google Books.</p>";
        }
    });

    loadBooks();
});
