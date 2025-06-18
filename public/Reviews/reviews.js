document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("user");
    if (!user) {
        window.location.href = "/Autentificare/login.html";
    }

    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/Autentificare/login.html";
    });

    const bookSelect = document.getElementById("bookSelect");
    const reviewForm = document.getElementById("reviewForm");
    const reviewList = document.getElementById("reviewList");
    const errorMsg = document.getElementById("errorMsg");
    const showMoreBtn = document.getElementById("showMoreBtn");
    const filterSelect = document.getElementById("filterSelect");
    const sortSelect = document.getElementById("sortSelect");

    let allReviews = [];
    let filteredReviews = [];
    let currentIndex = 0;
    const BATCH_SIZE = 3;

    async function loadBooks() {
        const res = await fetch("/api/books");
        const books = await res.json();
        books.forEach(book => {
            const option1 = document.createElement("option");
            option1.value = book.title;
            option1.textContent = `${book.title} (${book.author})`;
            bookSelect.appendChild(option1);

            const option2 = document.createElement("option");
            option2.value = book.title;
            option2.textContent = book.title;
            filterSelect.appendChild(option2);
        });
    }

    async function fetchReviews() {
        const res = await fetch("/api/reviews");
        allReviews = await res.json();
        applyFilter();
    }

    function applyFilter() {
        const selected = filterSelect.value;
        filteredReviews = selected === "all"
            ? [...allReviews]
            : allReviews.filter(r => r.book === selected);
        applySort();
    }

    function applySort() {
        const sortBy = sortSelect.value;

        if (sortBy === "high") {
            filteredReviews.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "low") {
            filteredReviews.sort((a, b) => a.rating - b.rating);
        } else {
            filteredReviews = [...filteredReviews].reverse();
        }

        currentIndex = 0;
        reviewList.innerHTML = "";
        renderMoreReviews();
    }

    function renderMoreReviews() {
        const nextBatch = filteredReviews.slice(currentIndex, currentIndex + BATCH_SIZE);
        nextBatch.forEach(review => {
            const card = document.createElement("div");
            card.className = "review-card";
            card.innerHTML = `
                <h3>${review.book}</h3>
                <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p>${review.comment}</p>
                <div class="meta">Scris de ${review.user}</div>
            `;
            reviewList.appendChild(card);
        });
        currentIndex += BATCH_SIZE;
        showMoreBtn.textContent = currentIndex < filteredReviews.length
            ? "🔽 Vezi mai multe recenzii"
            : "🔼 Ascunde recenziile";
        showMoreBtn.style.display = filteredReviews.length > BATCH_SIZE ? "block" : "none";
    }

    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const comment = document.getElementById("comment").value.trim();
        const ratingValue = parseInt(document.getElementById("rating").value);

        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        if (!comment) {
            errorMsg.textContent = "Comentariul nu poate fi gol.";
            errorMsg.style.display = "block";
            return;
        }

        if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
            errorMsg.textContent = "Te rugăm să alegi o evaluare între 1 și 5 stele.";
            errorMsg.style.display = "block";
            return;
        }

        const data = {
            user,
            book: bookSelect.value,
            comment,
            rating: ratingValue
        };

        await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        reviewForm.reset();
        fetchReviews();
    });

    showMoreBtn.addEventListener("click", () => {
        if (currentIndex < filteredReviews.length) {
            renderMoreReviews();
        } else {
            currentIndex = 0;
            reviewList.innerHTML = "";
            renderMoreReviews();
        }
    });

    filterSelect.addEventListener("change", applyFilter);
    sortSelect.addEventListener("change", applySort);

    loadBooks();
    fetchReviews();
});
