const http = require('http');
const express = require('express');
const bodyParser = require('body-parser'); // This used to be baked into express, all I use it for is parsing the stream of POST data.
const config = require('../config');
const hostname = config.host;
const port = config.port;
var url_router = require('./controllers/urls');
var properties = require('./properties');

server = express();
server.use(bodyParser.json());
server.use('/', url_router(properties));
server.use(function (err, req, res, next) {
  if (err){
    console.log(err);
    res.status(500).json({response:"There was an internal server error"});
//    res.end();
  }
});

server.listen(port, hostname, () => console.log('Started server, only errors will be seen here'));

module.exports.server  = server;
module.exports.properties = properties;
