const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.post('/upload-score', (req, res) => {
    const upload = req.upload.single('paper_image');
    
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ error: "File upload failed" });

        const { student_id, subject_id, score, category } = req.body;
        const imageUrl = req.file ? req.file.filename : null;

        const sql = "INSERT INTO records (student_id, subject_id, score, category, paper_image_url) VALUES (?, ?, ?, ?, ?)";
        
        try {
            const [result] = await db.execute(sql, [student_id, subject_id, score, category, imageUrl]);
            return res.json({ 
                message: "Score and physical evidence backed up! ✅", 
                recordId: result.insertId,
                fileName: imageUrl 
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });
});

router.get('/get-records', async (req, res) => {
    try {
        const [data] = await db.execute("SELECT * FROM records"); 
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
