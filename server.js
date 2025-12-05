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
    const sql = 'SELECT  kd_produk, nm_brg, hrg, ket_stok FROM vendor_a ORDER BY kd_produk ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/vendor-a/:kd_produk', async (req, res, next)=>{
    const sql = 'SELECT kd_produk, nm_brg, hrg, ket_stok FROM vendor_a where kd_produk = $1';
    try {
        const result = await db.query(sql, [req.params.kd_produk]);
        if (result.rows.length === 0){
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

app.put('/vendor-a/:kd_produk', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const {nm_brg, hrg, ket_stok} = req.body;
    const sql ='UPDATE vendor_a SET nm_brg =$1, hrg =$2, ket_stok =$3 WHERE kd_produk =$4 RETURNING *';
    try{
        const result = await db.query(sql, [nm_brg, hrg, ket_stok, req.params.kd_produk]);
        if  (result.rowCount === 0) {
            return res.status(404).json({error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }  
});


app.delete('/vendor-a/:kd_produk', [authenticateToken, authorizeRole('admin')], async (req, res, next) =>{
    const sql = 'DELETE FROM vendor_a WHERE kd_produk = $1 RETURNING *';
    try{
        const result = await db.query(sql, [req.params.kd_produk]);
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
    const sql = 'SELECT sku, "productName", price, "isAvailable" FROM vendor_b ORDER BY sku ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/vendor-b/:sku', async (req, res, next)=>{
    const sql = 'SELECT sku, "productName", price, "isAvailable" FROM vendor_b where sku = $1';
    try {
        const result = await db.query(sql, [req.params.sku]);
        if (result.rowCount.length === 0){
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    }catch (err){
        next(err);
    }
}); 

app.post('/vendor-b', authenticateToken, async (req, res, next) => {
    const { sku, productName, price, isAvailable } = req.body;
    if (!sku || !productName || !price || isAvailable === undefined){
        return res.status(400).json({ error: '"productName", price, "isAvailable" wajib diisi'});
    }
    const sql = 'INSERT INTO vendor_b (sku, "productName", price, "isAvailable") VALUES ($1, $2, $3, $4 ) RETURNING *';
    try{
        const result = await db.query(sql, [sku, productName, price, isAvailable]);
        res.status(201).json(result.rows[0]);
    }catch (err){
        next(err);
    }
});

app.put('/vendor-b/:sku', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const { productName, price, isAvailable } = req.body;
    const sql ='UPDATE vendor_b SET "productName" =$1, price =$2, "isAvailable" =$3 WHERE sku =$4 RETURNING *';
    try{
        const result = await db.query(sql, [productName, price, isAvailable, req.params.sku]);
        if  (result.rowCount === 0) {
            return res.status(404).json({error: 'Produk tidak ditemukan'});
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }  
});


app.delete('/vendor-b/:sku',[authenticateToken, authorizeRole('admin')], async (req, res, next) =>{
    const sql = 'DELETE FROM vendor_b WHERE sku = $1 RETURNING *';
    try{
        const result = await db.query(sql, [req.params.sku]);
        if (result.rowCount === 0 ) {
            return res.status(404).json({ error: 'Produk tidak ditemukan'});
        }
        res.status(204).send();
    }catch (err) {
        next (err);
    }
});


//vendor C (Restu sulung Purpangestu)
app.get(`/vendor-c`, async (req, res, next) => {
    const sql = 'Select * FROM vendor_c ORDER BY  id ASC';
    try {
        const result = await db.query(sql);
        const data = result.rows.map(row => ({
            id:row.id,
            details:{
                name:row.name,
                category:row.category,
            },
            pricing:{
                base_price:row.base_price,
                tax:row.tax
            },
            stock:row.stock
        }));
        res.json(data);
    } catch (err) {
        next(err);
    }
});

app.get(`/vendor-c/:id`, async(req, res, next) => {
    const sql = 'SELECT * FROM vendor_c WHERE ID =$1';
    try {
        const result  = await db.query(sql, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({error: `Prosduk Not FOund`});
        }
        const row = result.rows[0];

        const data = {
            id:row.id,
            details:{
                name:row.name,
                category:row.category,
            },
            pricing:{
                base_price:row.base_price,
                tax:row.tax
            },
            stock:row.stock
        };
        res.json(data);
    } catch (err){
        next(err);
    }
});

app.post(`/vendor-c`, async(req, res, next) =>{
    const {id, details, pricing, stock} = req.body;

    if(!id  || !details?.name|| !details?.category || !pricing?.base_price || !pricing?.tax ) {
        return res.status(400).json({error: `Data JSON tidak lengkap(pastikan lengkap)`});
    }

    const sql = 'INSERT INTO vendor_c (id, name, category, base_price, tax, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';

    try{
        const result = await db.query(sql, [
            id,
            details.name,
            details.category,
            pricing.base_price,
            pricing.tax,
            stock
        ]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put(`/vendor-c/:id`, async(req, res, next) => {
    const{details, pricing, stock}=req.body;

    const sql = 'UPDATE vendor_c SET name=$1, category=$2, base_price=$3, tax=$4, stock=$5 WHERE ID =$6 RETURNING *';

    try {
        const result = await db.query(sql, [
            details.name,
            details.category,
            pricing.base_price,
            pricing.tax,
            stock,
            req.params.id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({error: `Data Not Found`});
        }
        res.json(result.rows[0]);
    }catch(err){
        next(err);
    }
});

app.delete(`/vendor-c/:id`, async(req, res, next) => {
    const sql = 'DELETE FROM vendor_c where ID=$1 RETURNING *';
    try{
        const result =await db.query(sql, [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({error: `DATA Not FOund`});
        }
        res.status(204).send();
    }catch(err){
        next(err);
    }
});



//LEAD INTEGRATOR ARYA
app.get('/api/banyuwangi-marketplace', async (req, res, next) => {
    try {
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const [resA, resB, resC] = await Promise.all([
            fetch(`${baseUrl}/vendor-a`),
            fetch(`${baseUrl}/vendor-b`),
            fetch(`${baseUrl}/vendor-c`),
        ]);

        const dataA = await resA.json();
        const dataB = await resB.json();
        const dataC = await resC.json();

        let normalizeData = [];

        const mapA = dataA.map(item => {
            let harga = parseInt(item.hrg);
            let hargaFinal = harga - (harga * 0.10);
            return {
                id: item.kd_produk,
                nama_produk: item.nm_brg,
                harga: hargaFinal,
                status: item.ket_stok,
                sumber: "vendor A"
            };
        });

        const mapB = dataB.map(item => {
            let status = item.isAvailable ? "Tersedia" : "Habis";
            return {
                id: item.sku,
                nama_produk: item.productName,
                harga: item.price,
                status:status,
                sumber: "Vendor B"
            };
        });

            const mapC = dataC.map(item => {
            let base = parseInt(item.pricing?.base_price || 0);
            let tax = parseInt(item.pricing?.tax || 0);
            let finalPrice = base + tax;
            let name = item.details.name;
            if (item.details.category === 'Food') name += " (Recommended)";
            let status = item.stock > 0 ? "Tersedia" : "Habis";
            return {
                id: item.id,
                nama_produk: name,
                harga: finalPrice,
                status:status,
                sumber: "Vendor C"
            };
        });

        normalizeData = [...mapA, ...mapB, ...mapC];

        res.json({
            status: "success",
            total_data: normalizeData.length,
            data: normalizeData
        });
    } catch (err) {
        next(err);
    }
})


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