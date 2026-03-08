const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'furiorollinmanuel',
    database: 'scoresafe_db'
});

module.exports = db.promise();