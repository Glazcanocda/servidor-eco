const express = require('express');
const { ExpressPeerServer } = require('peer');
const fs = require('fs'); // Para guardar registro básico local o conectar DB

const app = express();
app.enable('trust proxy');
app.use(express.json());

const PORT = process.env.PORT || 9000;

// Registro simple de sesiones en memoria/archivo
let historialSesiones = [];

app.get('/', (req, res) => {
    res.send('Servidor de Señalización Ecográfica y Métricas Activo');
});

// Endpoint para consultar reportes desde el Dashboard
app.get('/api/reportes', (req, res) => {
    res.json(historialSesiones);
});

const server = app.listen(PORT, () => {
    console.log(`Servidor de Ecografía escuchando en el puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

// Interceptar eventos de llamada para auditoría
peerServer.on('connection', (client) => {
    console.log(`Cliente conectado: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`Cliente desconectado: ${client.getId()}`);
});

app.use('/peerjs', peerServer);
