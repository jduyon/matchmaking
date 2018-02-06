const http = require('http');
const express = require('express');
const config = require('../config');
const hostname = config.host;
const port = config.port;
var user_router = require('./routes/user');

server = express();
server.get('/', (req, res) => res.send('Hello World!'))
server.use('/user', user_router);
module.exports = server;

//server.listen(port, hostname, () => console.log('Example app'));
