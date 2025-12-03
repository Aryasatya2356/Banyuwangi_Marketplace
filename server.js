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

app.get('/vendor-a', async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM vendor_a ORDER BY id ASC');
        // Mapping Database -> JSON Format Soal
        const data = result.rows.map(row => ({
            id_db: row.id, // ID Database (perlu untuk edit/delete)
            kd_produk: row.kd_produk,
            nm_brg: row.nm_brg,
            hrg: row.hrg,
            ket_stok: row.ket_stok
        }));
        res.json(data);
    } catch (err) { next(err); }
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