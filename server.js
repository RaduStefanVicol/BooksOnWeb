const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db'); // baza de date SQLite
const JWT_SECRET = 'super-secret-jwt-key';
const PORT = 3000;

function generateRSS(books) {
    const rssItems = books.map(book => `
      <item>
        <title>${book.title}</title>
        <description>Categorie: ${book.category} - Autor: ${book.author}</description>
        <link>http://localhost:3000/</link>
        <pubDate>${new Date().toUTCString()}</pubDate>
      </item>
    `).join('\n');

    const rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Books on Web - Noutăți</title>
    <link>http://localhost:3000/</link>
    <description>Ultimele cărți adăugate în platformă</description>
    ${rssItems}
  </channel>
</rss>`;

    fs.writeFileSync('./public/rss.xml', rssContent);
}

const server = http.createServer((req, res) => {
    if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Username și parolă necesare' }));
            }
            const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
            db.run(sql, [username, password], function(err) {
                if (err) {
                    if (err.message.includes("UNIQUE")) {
                        res.writeHead(409, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Utilizatorul există deja' }));
                    }
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Eroare server' }));
                }
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Înregistrare reușită' }));
            });
        });
        return;
    }

    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
            db.get(sql, [username, password], (err, user) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Eroare server' }));
                }
                if (user) {
                    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Autentificare reușită', token }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Nume sau parolă incorecte' }));
                }
            });
        });
        return;
    }

    if (req.url === '/api/books' && req.method === 'GET') {
        const booksPath = './data/books.json';
        if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, '[]');
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(books));
        return;
    }

    if (req.url === '/api/books' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const newBook = JSON.parse(body);
            const requiredFields = ['title', 'author', 'year', 'category'];
            const missing = requiredFields.filter(f => !newBook[f]);
            if (missing.length) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Câmpuri lipsă: ${missing.join(', ')}` }));
            }
            const booksPath = './data/books.json';
            if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, '[]');
            const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
            books.push(newBook);
            fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));
            generateRSS(books);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Carte adăugată cu succes' }));
        });
        return;
    }

    if (req.url === '/api/reading' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const book = JSON.parse(body);
            const filePath = './data/reading.json';
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
            const reading = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const exists = reading.find(b => b.title === book.title && b.author === book.author);
            if (!exists) reading.push(book);
            fs.writeFileSync(filePath, JSON.stringify(reading, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Carte adăugată pentru citire' }));
        });
        return;
    }

    if (req.url === '/api/reading' && req.method === 'GET') {
        const filePath = './data/reading.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        const reading = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reading));
        return;
    }
    if (req.url.startsWith('/api/reading') && req.method === 'DELETE') {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const title = urlObj.searchParams.get('title');
        const author = urlObj.searchParams.get('author');

        const filePath = './data/reading.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');

        let reading = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        reading = reading.filter(b => !(b.title === title && b.author === author));

        fs.writeFileSync(filePath, JSON.stringify(reading, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Carte eliminată din citire' }));
        return;
    }

    if (req.url === '/api/progress' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const entry = JSON.parse(body);
            const filePath = './data/progress.json';

            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
            let progress = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // înlocuiește dacă există deja
            const index = progress.findIndex(p => p.title === entry.title && p.author === entry.author);
            if (index !== -1) {
                progress[index] = entry;
            } else {
                progress.push(entry);
            }

            fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Progres salvat' }));
        });
        return;
    }
    if (req.url === '/api/progress' && req.method === 'GET') {
        const filePath = './data/progress.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        const progress = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(progress));
        return;
    }


    if (req.url === '/api/favorite' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const book = JSON.parse(body);
            const filePath = './data/favorite.json';
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
            const favorites = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const exists = favorites.find(b => b.title === book.title && b.author === book.author);
            if (!exists) favorites.push(book);
            fs.writeFileSync(filePath, JSON.stringify(favorites, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Carte adăugată la favorite' }));
        });
        return;
    }

    if (req.url === '/api/favorite' && req.method === 'GET') {
        const filePath = './data/favorite.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        const favorites = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(favorites));
        return;
    }

    if (req.url.startsWith('/api/favorite') && req.method === 'DELETE') {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const title = urlObj.searchParams.get('title');
        const author = urlObj.searchParams.get('author');

        const filePath = './data/favorite.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        let favorites = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        favorites = favorites.filter(b => !(b.title === title && b.author === author));
        fs.writeFileSync(filePath, JSON.stringify(favorites, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Carte eliminată din favorite' }));
        return;
    }

    if (req.url === '/api/reviews' && req.method === 'GET') {
        const reviewsPath = './data/reviews.json';
        if (!fs.existsSync(reviewsPath)) fs.writeFileSync(reviewsPath, '[]');
        const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reviews));
        return;
    }

    if (req.url === '/api/reviews' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const newReview = JSON.parse(body);
            const requiredFields = ['user', 'book', 'comment', 'rating'];
            if (newReview.rating < 1 || newReview.rating > 5) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Rating invalid (1-5)' }));
            }
            const missing = requiredFields.filter(f => !newReview[f]);
            if (missing.length) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Campuri lipsa: ${missing.join(', ')}` }));
            }
            const reviewsPath = './data/reviews.json';
            if (!fs.existsSync(reviewsPath)) fs.writeFileSync(reviewsPath, '[]');
            const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
            reviews.push(newReview);
            fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Recenzie adaugata cu succes' }));
        });
        return;
    }

    if (req.url === '/api/libraries' && req.method === 'GET') {
        const libPath = './data/libraries.json';
        if (!fs.existsSync(libPath)) fs.writeFileSync(libPath, '[]');
        const libraries = JSON.parse(fs.readFileSync(libPath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(libraries));
        return;
    }
    const groupFilePath = './data/group-reading.json';

// POST /api/group-reading
    if (req.url === '/api/group-reading' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const book = JSON.parse(body);
            if (!fs.existsSync(groupFilePath)) fs.writeFileSync(groupFilePath, '[]');
            const groupBooks = JSON.parse(fs.readFileSync(groupFilePath, 'utf-8'));
            const exists = groupBooks.find(b => b.title === book.title && b.author === book.author);
            if (!exists) groupBooks.push(book);
            fs.writeFileSync(groupFilePath, JSON.stringify(groupBooks, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Carte adăugată în grup' }));
        });
        return;
    }


    if (req.url === '/api/group-reading' && req.method === 'GET') {
        if (!fs.existsSync(groupFilePath)) fs.writeFileSync(groupFilePath, '[]');
        const groupBooks = JSON.parse(fs.readFileSync(groupFilePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(groupBooks));
        return;
    }

    // POST /api/group-progress
    if (req.url === '/api/group-progress' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const entry = JSON.parse(body);
            const filePath = './data/group-progress.json';
            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');

            let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const index = data.findIndex(p => p.title === entry.title && p.author === entry.author && p.user === entry.user);

            if (index !== -1) {
                data[index] = entry;
            } else {
                data.push(entry);
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Progres de grup salvat' }));
        });
        return;
    }

// GET /api/group-progress?title=X&author=Y&user=Z
    if (req.url.startsWith('/api/group-progress?') && req.method === 'GET') {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const title = urlObj.searchParams.get('title');
        const author = urlObj.searchParams.get('author');
        const user = urlObj.searchParams.get('user');

        const filePath = './data/group-progress.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const match = data.find(p => p.title === title && p.author === author && p.user === user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match || {}));
        return;
    }

// GET /api/group-progress/all?title=X&author=Y
    if (req.url.startsWith('/api/group-progress/all') && req.method === 'GET') {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const title = urlObj.searchParams.get('title');
        const author = urlObj.searchParams.get('author');

        const filePath = './data/group-progress.json';
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const matches = data.filter(p => p.title === title && p.author === author);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(matches));
        return;
    }



    if (req.method === 'GET') {
        let filePath = './public' + (req.url === '/' ? '/index.html' : req.url);
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.xml': 'application/xml'
        };
        const contentType = contentTypes[ext] || 'text/plain';
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('404 - Fisierul nu a fost gasit');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('404 - Ruta necunoscută');
});

server.listen(PORT, () => {
    console.log(` Serverul rulează la: http://localhost:${PORT}`);
});