const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'furiorollinmanuel',
    database: 'scoresafe_db'
});

router.post('/upload-score', (req, res) => {
    const upload = req.upload.single('paper_image');
    
    upload(req, res, (err) => {
        if (err) return res.status(500).json({ error: "File upload failed" });

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
});

router.get('/get-records', (req, res) => {
    const sql = "SELECT * FROM records"; 
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(data);
    });
});

module.exports = router;
