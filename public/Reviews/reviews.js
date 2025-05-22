document.addEventListener("DOMContentLoaded", () => {
    const bookSelect = document.getElementById("bookSelect");
    const reviewForm = document.getElementById("reviewForm");
    const commentInput = document.getElementById("comment");
    const reviewList = document.getElementById("reviewList");

    // 1. Încarcă lista cărților din books.json
    async function loadBooks() {
        try {
            const response = await fetch('/api/books.json');
            const books = await response.json();
            books.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = `${book.title} - ${book.author}`;
                bookSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Eroare la încărcarea cărților:", error);
        }
    }

    async function loadReviews() {
        try {
            const response = await fetch('/api/reviews');
            const reviews = await response.json();

            reviewList.innerHTML = "";

            reviews.reverse().forEach(review => {
                const card = document.createElement('div');
                card.classList.add('review-card');
                card.innerHTML = `
                    <strong>${review.username}</strong> pentru <em>${review.bookId}</em><br>
                    ${review.content}<br>
                    <small>${new Date(review.date).toLocaleString()}</small>
                `;
                reviewList.appendChild(card);
            });
        } catch (error) {
            console.error("Eroare la încărcarea recenziilor:", error);
        }
    }

    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const selectedBookId = bookSelect.value;
        const comment = commentInput.value;

        const username = localStorage.getItem("username") || "Anonim";

        const review = {
            bookId: selectedBookId,
            content: comment,
            username: username,
            date: new Date().toISOString()
        };

        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(review)
            });

            commentInput.value = "";
            bookSelect.value = "";
            loadReviews(); // reîncarcă lista
        } catch (error) {
            console.error("Eroare la trimiterea recenziei:", error);
        }
    });


    document.getElementById("logout").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "/Login/login.html";
    });

    loadBooks();
    loadReviews();
});
