const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data", "database.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Verific utilizatorii cu parole necriptate...");

    db.all("SELECT * FROM users WHERE password NOT LIKE '$2%'", (err, rows) => {
        if (err) {
            console.error("Eroare la interogare:", err.message);
            db.close();
            return;
        }

        if (rows.length === 0) {
            console.log("Toți utilizatorii au parole criptate.");
            db.close();
        } else {
            console.log("Utilizatori cu parole necriptate găsiți:", rows.length);
            rows.forEach(user => {
                console.log(`- ${user.username}`);
            });

            db.run("DELETE FROM users WHERE password NOT LIKE '$2%'", function (err) {
                if (err) {
                    console.error("Eroare la ștergere:", err.message);
                } else {
                    console.log(`✅ ${this.changes} utilizatori șterși.`);
                }
                db.close(); // închidem conexiunea doar după execuția lui run
            });
        }
    });
});
