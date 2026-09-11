const express = require('express');
const path = require('path');
const { ExpressPeerServer } = require('peer');

const app = express();
app.enable('trust proxy');

const PORT = process.env.PORT || 9000;

// Servir la interfaz web (index.html) directamente desde el servidor
app.use(express.static(__dirname));

const server = app.listen(PORT, () => {
    console.log(`Servidor de Ecografía escuchando en el puerto ${PORT}`);
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/',
    proxied: true,
    alive_timeout: 60000
});

app.use('/peerjs', peerServer);
