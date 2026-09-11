const express = require('express');
const path = require('path');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');

const app = express();
app.enable('trust proxy');
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 9000;
const DB_FILE = path.join(__dirname, 'sesiones.json');

// Inicializar archivo de base de datos JSON si no existe
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// --- RUTAS DE NAVEGACIÓN ---

// Ruta Principal (Emisor / Receptor)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de Administración y Auditoría
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- API DE REPORTES Y AUDITORÍA ---
app.get('/api/reportes', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/reportes/registrar', (req, res) => {
    const { centro, sala, radiologo, duracionSegundos, inicio, fin } = req.body;

    if (!duracionSegundos || duracionSegundos < 2) return res.json({ status: 'ignored' });

    const nuevoRegistro = {
        centro: centro || 'No Especificado',
        sala: sala || 'No Especificada',
        radiologo: radiologo || 'Radiólogo Anónimo',
        inicio: inicio,
        fin: fin,
        duracionSegundos: duracionSegundos,
        duracionFormateada: `${Math.floor(duracionSegundos / 60)}m ${duracionSegundos % 60}s`
    };

    try {
        const logs = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        logs.unshift(nuevoRegistro);
        fs.writeFileSync(DB_FILE, JSON.stringify(logs, null, 2));
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Servidor de Telemedicina escuchando en el puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

app.use('/peerjs', peerServer);
