const mysql = require('mysql2');
const express = require('express');
const app = express();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(express.json()); 

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'furiorollinmanuel',
    database: 'scoresafe_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Backend is connected to the Database! Task BS-6 Done.');
});

app.post('/api/upload-score', upload.single('paper_image'), (req, res) => {
    const { student_id, subject_id, score, category } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    const sql = "INSERT INTO records (student_id, subject_id, score, category, paper_image_url) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [student_id, subject_id, score, category, imageUrl], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({ 
            message: "Score and physical evidence backed up! ✅", 
            recordId: result.insertId,
            fileName: imageUrl 
        });
    });
});

app.listen(5000, () => console.log('Server running on port 5000'));

app.post('/api/add-student', (req, res) => {
    const { name, email } = req.body; 
    const sql = "INSERT INTO students (full_name, email) VALUES (?, ?)";
    db.query(sql, [name, email], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "Student Saved!", id: result.insertId });
    });
});

app.get('/api/get-records', (req, res) => {
    const sql = "SELECT * FROM records"; 
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});