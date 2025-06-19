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

    function postWithToken(url, data) {
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
    }

    const list = document.getElementById("bookList");
    const categoryFilter = document.getElementById("categoryFilter");
    const authorFilter = document.getElementById("authorFilter");
    const publisherFilter = document.getElementById("publisherFilter");
    const yearFilter = document.getElementById("yearFilter");

    let allBooks = [];

    function populateFilters(books) {
        const categories = new Set();
        const authors = new Set();
        const publishers = new Set();
        const years = new Set();

        books.forEach(book => {
            if (book.category) categories.add(book.category);
            if (book.author) authors.add(book.author);
            if (book.publisher) publishers.add(book.publisher);
            if (book.year) years.add(book.year);
        });

        for (const val of categories) categoryFilter.innerHTML += `<option value="${val}">${val}</option>`;
        for (const val of authors) authorFilter.innerHTML += `<option value="${val}">${val}</option>`;
        for (const val of publishers) publisherFilter.innerHTML += `<option value="${val}">${val}</option>`;
        [...years].sort().forEach(val => yearFilter.innerHTML += `<option value="${val}">${val}</option>`);
    }

    function displayBooks(books) {
        list.innerHTML = "";
        books.forEach(book => {
            const card = document.createElement("div");
            card.className = "book-card";

            const title = document.createElement("strong");
            title.textContent = book.title;

            const author = document.createElement("span");
            author.textContent = `de ${book.author} (${book.year})`;

            const category = document.createElement("em");
            category.textContent = book.category;

            const publisher = document.createElement("div");
            publisher.textContent = `Editura: ${book.publisher || "Nespecificată"}`;

            const edition = document.createElement("div");
            edition.textContent = `Ediție: ${book.edition || "-"}`;

            const related = document.createElement("div");
            if (book.related && book.related.length > 0) {
                related.innerHTML = `<em>Cărți înrudite:</em> ${book.related.join(", ")}`;
            }

            const readBtn = document.createElement("button");
            readBtn.textContent = "Citește";
            readBtn.onclick = () => {
                postWithToken("/api/reading", book).then(() => {
                    window.location.href = "/Books/citire.html";
                });
            };
            readBtn.classList.add("btn-read");

            const favBtn = document.createElement("button");
            favBtn.textContent = " Favorite";
            favBtn.onclick = () => {
                postWithToken("/api/favorite", book).then(() => {
                    window.location.href = "/Books/favorite.html";
                });
            };
            favBtn.classList.add("btn-fav");

            const groupBtn = document.createElement("button");
            groupBtn.textContent = "Citire în grup";
            groupBtn.onclick = () => {
                fetch("/api/group-reading", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(book)
                }).then(() => {
                    window.location.href = "/Books/citire-grup.html";
                });
            };

            card.appendChild(title);
            card.appendChild(document.createElement("br"));
            card.appendChild(author);
            card.appendChild(document.createElement("br"));
            card.appendChild(category);
            card.appendChild(document.createElement("br"));
            card.appendChild(publisher);
            card.appendChild(edition);
            card.appendChild(related);
            card.appendChild(readBtn);
            card.appendChild(favBtn);
            card.appendChild(groupBtn);

            list.appendChild(card);
        });
    }

    function filterBooks() {
        const cat = categoryFilter.value;
        const aut = authorFilter.value;
        const pub = publisherFilter.value;
        const yr = yearFilter.value;

        const filtered = allBooks.filter(b =>
            (!cat || b.category === cat) &&
            (!aut || b.author === aut) &&
            (!pub || b.publisher === pub) &&
            (!yr || String(b.year) === yr)
        );

        displayBooks(filtered);
    }

    document.getElementById("filterForm")?.addEventListener("change", filterBooks);

    function loadBooks() {
        fetch("/api/books")
            .then(res => res.json())
            .then(books => {
                allBooks = books.reverse();
                populateFilters(allBooks);
                displayBooks(allBooks);
            });
    }

    loadBooks();

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
                googleResults.innerHTML = "<p>Cartea nu este disponibilă.</p>";

                fetch("/api/libraries")
                    .then(res => res.json())
                    .then(libraries => {
                        const msg = document.createElement("p");
                        msg.innerText = "Iată câteva biblioteci din apropiere:";
                        googleResults.appendChild(msg);

                        libraries.forEach(lib => {
                            const div = document.createElement("div");
                            div.className = "library-card";
                            div.innerHTML = `
                                <strong>${lib.name}</strong><br>
                                <span>${lib.address}</span><br>
                                <a href="${lib.mapsLink}" target="_blank"> Deschide în Google Maps</a>
                            `;
                            googleResults.appendChild(div);
                        });
                    });
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

                const bookData = {
                    title: volume.title,
                    author: volume.authors?.join(", ") || "Autor necunoscut",
                    year: volume.publishedDate || "",
                    category: volume.categories?.[0] || "Nespecificat"
                };

                const readBtn = document.createElement("button");
                readBtn.textContent = "Citește";
                readBtn.onclick = () => {
                    postWithToken("/api/books", bookData)
                        .finally(() => {
                            postWithToken("/api/reading", bookData)
                                .then(() => window.location.href = "/Books/citire.html");
                        });
                };

                const favBtn = document.createElement("button");
                favBtn.textContent = " Favorite";
                favBtn.onclick = () => {
                    postWithToken("/api/favorite", bookData)
                        .then(() => window.location.href = "/Books/favorite.html");
                };

                const groupBtn = document.createElement("button");
                groupBtn.textContent = "Citire în grup";
                groupBtn.onclick = () => {
                    fetch("/api/group-reading", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bookData)
                    }).then(() => window.location.href = "/Books/citire-grup.html");
                };

                card.appendChild(readBtn);
                card.appendChild(favBtn);
                card.appendChild(groupBtn);
                googleResults.appendChild(card);
            });
        } catch (err) {
            googleResults.innerHTML = "<p>Eroare la conectarea cu Google Books.</p>";
        }
    });
});
