const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super-secret-jwt-key';

const PORT = 3000;

const server = http.createServer((req, res) => {

    // ✅ REGISTER
    if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });

        req.on('end', () => {
            const { username, password } = JSON.parse(body);

            if (!username || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Username și parolă necesare' }));
            }

            const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));
            const exists = users.find(u => u.username === username);
            if (exists) {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Utilizatorul există deja' }));
            }

            users.push({ username, password });
            fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Înregistrare reușită' }));
        });
        return;
    }

    // ✅ LOGIN
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });

        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Autentificare reușită', token }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Nume sau parolă incorecte' }));
            }
        });
        return;
    }

    if (req.url === '/api/books' && req.method === 'GET') {
        const booksPath = './data/books.json';
        if (!fs.existsSync(booksPath)) {
            fs.writeFileSync(booksPath, '[]');
        }
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

            const missing = requiredFields.filter(field => !newBook[field]);
            if (missing.length) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: `Câmpuri lipsă: ${missing.join(', ')}` }));
            }

            const booksPath = './data/books.json';
            if (!fs.existsSync(booksPath)) {
                fs.writeFileSync(booksPath, '[]');
            }

            const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
            books.push(newBook);
            fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Carte adăugată cu succes' }));
        });
        return;
    }
    if (req.url === '/api/reviews' && req.method === 'GET') {
        const reviewsPath = './data/reviews.json';
        if (!fs.existsSync(reviewsPath)) {
            fs.writeFileSync(reviewsPath, '[]');
        }

        const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(reviews));
    }

    if (req.url === '/api/reviews' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });

        req.on('end', () => {
            const { bookId, content, username, date } = JSON.parse(body);
            if (!bookId || !content || !username || !date) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Toate câmpurile sunt necesare' }));
            }

            const reviewsPath = './data/reviews.json';
            if (!fs.existsSync(reviewsPath)) {
                fs.writeFileSync(reviewsPath, '[]');
            }

            const reviews = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
            reviews.push({ bookId, content, username, date });
            fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Recenzie salvată cu succes' }));
        });
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
        };
        const contentType = contentTypes[ext] || 'text/plain';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('404 - Fișierul nu a fost găsit');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
        return;
    }

    // ✅ DEFAULT 404
    res.writeHead(404);
    res.end('404 - Ruta necunoscută');
});

server.listen(PORT, () => {
    console.log(`✅ Serverul rulează la: http://localhost:${PORT}`);
});
