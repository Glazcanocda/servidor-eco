const express = require('express');
const { PeerServer } = require('peer');

const PORT = process.env.PORT || 9000;

// Crear e iniciar PeerServer directamente en el puerto asignado por Render
const peerServer = PeerServer({
    port: PORT,
    path: '/peerjs'
});

console.log(`Servidor de señalización activo en el puerto ${PORT}`);
