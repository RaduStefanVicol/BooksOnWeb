document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout");
    const bookFilter = document.getElementById("bookFilter");
    const totalReviews = document.getElementById("totalReviews");
    const averageRating = document.getElementById("averageRating");
    const uniqueUsers = document.getElementById("uniqueUsers");
    const reviewTableBody = document.querySelector("#reviewTable tbody");
    const downloadBtn = document.getElementById("downloadCsv");
    const chartCanvas = document.getElementById("ratingChart");

    let allReviews = [];
    let chart = null;

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/Autentificare/login.html";
    });

    async function loadBooks() {
        const res = await fetch("/api/books");
        const books = await res.json();
        books.forEach(book => {
            const opt = document.createElement("option");
            opt.value = book.title;
            opt.textContent = book.title;
            bookFilter.appendChild(opt);
        });
    }

    async function loadReviews() {
        const res = await fetch("/api/reviews");
        allReviews = await res.json();
        updateStatistics();
    }

    function updateStatistics() {
        const selectedBook = bookFilter.value;
        const filtered = selectedBook === "all" ? allReviews : allReviews.filter(r => r.book === selectedBook);

        // Număr total recenzii
        totalReviews.textContent = filtered.length;

        // Media rating
        const ratings = filtered.map(r => r.rating).filter(r => typeof r === 'number' && !isNaN(r));
        const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "–";
        averageRating.textContent = avg;

        // Utilizatori unici
        const unique = new Set(filtered.map(r => r.user)).size;
        uniqueUsers.textContent = unique;

        const ratingCounts = [0, 0, 0, 0, 0];
        ratings.forEach(r => {
            if (r >= 1 && r <= 5) ratingCounts[r - 1]++;
        });

        if (chart) chart.destroy();
        chart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: ['1⭐', '2⭐', '3⭐', '4⭐', '5⭐'],
                datasets: [{
                    label: 'Număr recenzii pe rating',
                    data: ratingCounts,
                    backgroundColor: '#7b2ff7',
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });

        // Tabel recenzii
        reviewTableBody.innerHTML = "";
        filtered.forEach(r => {
            const row = document.createElement("tr");
            row.innerHTML = `
        <td>${r.book}</td>
        <td>${r.user}</td>
        <td>${r.comment}</td>
        <td>${r.rating}</td>
      `;
            reviewTableBody.appendChild(row);
        });
    }

    downloadBtn.addEventListener("click", () => {
        const rows = [["Carte", "Utilizator", "Comentariu", "Rating"]];
        const selectedBook = bookFilter.value;
        const filtered = selectedBook === "all" ? allReviews : allReviews.filter(r => r.book === selectedBook);
        filtered.forEach(r => rows.push([r.book, r.user, r.comment, r.rating]));

        const csvContent = rows.map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "statistici_recenzii.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    bookFilter.addEventListener("change", updateStatistics);

    loadBooks();
    loadReviews();
});
