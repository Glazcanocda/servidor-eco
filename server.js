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
const SALAS_FILE = path.join(__dirname, 'salas.json');

// Inicializar archivos de datos si no existen
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
if (!fs.existsSync(SALAS_FILE)) {
    fs.writeFileSync(SALAS_FILE, JSON.stringify([
        { centro: 'Centro Médico Quillota', sala: 'Sala 1', id: 'centro-medico-quillota_sala-1' },
        { centro: 'Centro Médico Viña del Mar', sala: 'Sala 1', id: 'centro-medico-vina-del-mar_sala-1' }
    ]));
}

// --- RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- APIs ---
app.get('/api/reportes', (req, res) => {
    try { res.json(JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } 
    catch (e) { res.json([]); }
});

app.get('/api/salas', (req, res) => {
    try { res.json(JSON.parse(fs.readFileSync(SALAS_FILE, 'utf8'))); } 
    catch (e) { res.json([]); }
});

app.post('/api/salas/agregar', (req, res) => {
    const { centro, sala } = req.body;
    if (!centro || !sala) return res.status(400).json({ error: 'Faltan datos' });

    const cleanCentro = centro.trim().toLowerCase().replace(/\s+/g, '-');
    const cleanSala = sala.trim().toLowerCase().replace(/\s+/g, '-');
    const id = `${cleanCentro}_${cleanSala}`;

    try {
        const salas = JSON.parse(fs.readFileSync(SALAS_FILE, 'utf8'));
        if (!salas.some(s => s.id === id)) {
            salas.push({ centro, sala, id });
            fs.writeFileSync(SALAS_FILE, JSON.stringify(salas, null, 2));
        }
        res.json({ status: 'ok', id });
    } catch (e) {
        res.status(500).json({ error: e.message });
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
    console.log(`Servidor de Telemedicina activo en puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

app.use('/peerjs', peerServer);
