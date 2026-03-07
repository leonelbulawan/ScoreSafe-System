const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const scoreRoutes = require('./routes/scores');
const authRoutes = require('./routes/auth');

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use('/api/scores', (req, res, next) => {
    req.upload = upload; 
    next();
}, scoreRoutes);

app.use('/api/auth', authRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
