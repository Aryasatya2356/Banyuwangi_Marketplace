const express = require('express');
const cors = require('cors');
const db = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'film-api_punya arya' });
});

// app.get('/vendor-a', async (req, res, next) => {
//     try {
//         const result = await db.query('SELECT * FROM vendor_a ORDER BY id ASC');
//         // Mapping Database -> JSON Format Soal
//         const data = result.rows.map(row => ({
//             id_db: row.id, // ID Database (perlu untuk edit/delete)
//             kd_produk: row.kd_produk,
//             nm_brg: row.nm_brg,
//             hrg: row.hrg,
//             ket_stok: row.ket_stok
//         }));
//         res.json(data);
//     } catch (err) { next(err); }
// });

app.get('/vendor-a', async(req, res, next) => {
    const sql = 'SELECT id, kd_produk, nm_brg, hrg, ket_stok FROM vendor_a ORDER BY id ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

// app.get('/movies', async (req, res, next) => {
//     const sql = 'SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name FROM movies m LEFT JOIN directors d ON m.director_id = d.id ORDER BY m.id ASC';
//     try {
//         const result = await db.query(sql);
//         res.json(result.rows);
//     } catch (err) {
//         next(err);
//     }
// });

app.post('/vendor-a', async (req, res, next) => {
    const { kd_produk, nm_brg, hrg, ket_stok} = req.body;
    if (!kd_produk || !nm_brg || !hrg || !ket_stok){
        return res.status(400).json({ error: 'kd_produk, nm_brg, hrg, ket_stok wajib diisi'});
    }
    const sql = 'INSERT INTO vendor_a (kd_produk, nm_brg, hrg, ket_stok) VALUES ($1, $2, $3, $4) RETURNING *';
    try {
        const result = await db.query(sql, [kd_produk, nm_brg, hrg, ket_stok]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
})

// app.post('/movies', authenticateToken, async (req, res, next) => {
//     const { title, director_id, year } = req.body;
//     if (!title || !director_id || !year) {
//         return res.status(400).json({ error: 'title, director_id, year wajib diisi' });
//     }
//     const sql = 'INSERT INTO movies (title, director_id, year) VALUES ($1, $2, $3) RETURNING *';
//     try {
//         const result = await db.query(sql, [title, director_id, year]);
//         res.status(201).json(result.rows[0]);
//     } catch (err) {
//         next(err);
//     }
// });

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