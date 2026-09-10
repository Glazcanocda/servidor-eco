{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const \{ PeerServer \} = require('peer');\
\
const app = express();\
const PORT = process.env.PORT || 9000;\
\
const server = app.listen(PORT, () => \{\
    console.log(`Servidor activo en puerto $\{PORT\}`);\
\});\
\
const peerServer = PeerServer(\{\
    port: PORT,\
    path: '/peerjs',\
    proxied: true\
\});\
\
app.use('/peerjs', peerServer);\
\
app.get('/', (req, res) => \{\
    res.send('Servidor de Se\'f1alizaci\'f3n Activo');\
\});}