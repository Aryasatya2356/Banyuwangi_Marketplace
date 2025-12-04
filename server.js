require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRole,  } = require('./Middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'banyuwangi-marketplace_kelompok1' });
});

//registrasi
// app.post('/auth/register', async (req, res, next) => {
//     const { username, password, role } = req.body;
//     if (!username || !password || !role) {
//         return res.status(400).json({ error: 'username, password, role wajib diisi'});
//     }
//     const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *';
//     try{
//         const result = await db.query(sql, [username, password, role]);
//         res.status(201).json(result.rows[0]);
//     }catch (err){
//         next(err);
//     }
// });

app.post('/auth/register', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length <6 ) {
        return res.status(400).json({ error: 'Username dan password harus diisi'});
    }
    try {
        const salt = await  bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) returning id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'user']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        next(err);
    } 
});

app.post('/auth/register-admin', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'username dan password (min6 char) harus diisi'});
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'admin']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res. status(409).json({ error: 'Username sudah digunakan' });
        }
        next(err);
    }
});

app.post('/auth/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const sql = "SELECT * FROM users WHERE username = $1";
        const result = await db.query(sql, [username.toLowerCase()]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Kredensial tidak valid '});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Kredensial tidak valid '});
        }
        const payload = { user: { id: user.id, username: user.username, role: user.role }};
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login berhasil', token: token });
    } catch (err) {
        next(err);
    }
})

// vendor A Wempi kelompok 1
app.get('/vendor-a', async(req, res, next) => {
    const sql = 'SELECT id, kd_produk, nm_brg, hrg, ket_stok FROM vendor_a ORDER BY id ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/vendor-a/:id', async (req, res, next)=>{
    const sql = 'SELECT id, kd_produk, nm_brg, hrg, ket_stok FROM vendor_a where id = $1';
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount.length ===0){
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    }catch (err){
        next(err);
    }
}); 

app.post('/vendor-a', authenticateToken, async (req, res, next) => {
    const { kd_produk, nm_brg, hrg, ket_stok } = req.body;
    if (!kd_produk || !nm_brg || !hrg || !ket_stok) {
        return res.status(400).json({ error: 'kd_produk, nm_brg, hrg, ket_stok wajib diisi'});
    }
    const sql = 'INSERT INTO vendor_a (kd_produk, nm_brg, hrg, ket_stok) VALUES ($1, $2, $3, $4) RETURNING *';
    try{
        const result = await db.query(sql, [kd_produk, nm_brg, hrg, ket_stok]);
        res.status(201).json(result.rows[0]);
    }catch (err){
        next(err);
    }
});

app.put('/vendor-a/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const {kd_produk, nm_brg, hrg, ket_stok} = req.body;
    const sql ='UPDATE vendor_a SET kd_produk = $1, nm_brg =$2, hrg =$3, ket_stok =$4 WHERE id =$5 RETURNING *';
    try{
        const result = await db.query(sql, [kd_produk, nm_brg, hrg, ket_stok, req.params.id]);
        if  (result.rowCount === 0) {
            return res.status(404).json({error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }  
});


app.delete('/vendor-a/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) =>{
    const sql = 'DELETE FROM vendor_a WHERE id = $1 RETURNING *';
    try{
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount === 0 ) {
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.status(204).send();
    }catch (err) {
        next (err);
    }
});

// vendor B Zul kelompok 1
app.get('/vendor-b', async(req, res, next) => {
    const sql = 'SELECT id, sku, "productName", price, "isAvailable" FROM vendor_b ORDER BY id ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/vendor-b/:id', async (req, res, next)=>{
    const sql = 'SELECT id, sku, "productName", price, "isAvailable" FROM vendor_b where id = $1';
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount.length === 0){
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    }catch (err){
        next(err);
    }
}); 

app.post('/vendor-b', authenticateToken, async (req, res, next) => {
    const { sku, productName, price, isAvailable = undefined } = req.body;
    if (!sku || !productName || !price || !isAvailable) {
        return res.status(400).json({ error: 'sku, "productName", price, "isAvailable" wajib diisi'});
    }
    const sql = 'INSERT INTO vendor_b (sku, "productName", price, "isAvailable") VALUES ($1, $2, $3, $4) RETURNING *';
    try{
        const result = await db.query(sql, [sku, productName, price, isAvailable]);
        res.status(201).json(result.rows[0]);
    }catch (err){
        next(err);
    }
});

app.put('/vendor-b/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const {sku, productName, price, isAvailable } = req.body;
    const sql ='UPDATE vendor_b SET sku = $1, "productName" =$2, price =$3, "isAvailable" =$4 WHERE id =$5 RETURNING *';
    try{
        const result = await db.query(sql, [sku, productName, price, isAvailable, req.params.id]);
        if  (result.rowCount === 0) {
            return res.status(404).json({error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }  
});


app.delete('/vendor-b/:id',[authenticateToken, authorizeRole('admin')], async (req, res, next) =>{
    const sql = 'DELETE FROM vendor_b WHERE id = $1 RETURNING *';
    try{
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount === 0 ) {
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.status(204).send();
    }catch (err) {
        next (err);
    }
});


app.use((req, res) => {
    res.status(404).json({ error: 'Rute tidak ditemukan' });
});

app.use((err,req,res,next) =>{ 
    console.error('[SERVERERROR]',err.stack); 
    res.status(500).json({error:'Terjadikesalahanpadaserver'}); 
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});

module.exports = app;