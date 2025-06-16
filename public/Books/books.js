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
                        <strong>${book.title}</strong>
                        <span>de ${book.author} (${book.year})</span>
                        <em>${book.category}</em>

                        <button class="toggle-progress">📊 Progress</button>

                        <div class="progress-section" style="display: none; width: 100%; margin-top: 10px;">
                            <label>Număr total de pagini:</label>
                            <input type="number" class="total-pages" placeholder="Ex: 300">

                            <label>Pagina actuală:</label>
                            <input type="number" class="current-page" placeholder="Ex: 45">

                            <button class="calculate-progress">Calculează progres</button>
                            <div class="progress-output" style="margin-top: 6px; font-weight: bold;"></div>
                        </div>
                    `;
    list.appendChild(card);

    const toggleBtn = card.querySelector(".toggle-progress");
    const progressSection = card.querySelector(".progress-section");
    const calcBtn = card.querySelector(".calculate-progress");
    const totalInput = card.querySelector(".total-pages");
    const currentInput = card.querySelector(".current-page");
    const output = card.querySelector(".progress-output");

    toggleBtn.addEventListener("click", () => {
    progressSection.style.display =
    progressSection.style.display === "none" ? "block" : "none";
});

    calcBtn.addEventListener("click", () => {
    const total = parseInt(totalInput.value);
    const current = parseInt(currentInput.value);

    if (
    isNaN(total) || isNaN(current) ||
    total <= 0 || current < 0 || current > total
    ) {
    output.textContent = "Date invalide.";
    return;
}

    const percent = ((current / total) * 100).toFixed(1);
    output.textContent = `Ai citit ${percent}% din carte. 📚`;
});
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
    googleResults.innerHTML = "<p>Cartea nu este disponibilă.</p>";

    // Recomandă biblioteci locale
    fetch("/api/libraries") // sau `mockLibraries.json`
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
                                <a href="${lib.mapsLink}" target="_blank">📍 Deschide în Google Maps</a>
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
    googleResults.appendChild(card);
});
} catch (err) {
    googleResults.innerHTML = "<p>Eroare la conectarea cu Google Books.</p>";
}
});

    loadBooks();
});
