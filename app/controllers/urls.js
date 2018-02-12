// Routing methods for retrieving and updating user info
var router = require('express').Router();
var matchmaking = require('./matchmaking');
var startMatchmakingHandler = matchmaking.startMatchmakingHandler;

// I wrapped the router module because I want properties to be created
// in the server module and passed to the matchmaking handler
function routerClosure(properties){

  router.get('/', (req, res) => {
    res.json({ response: 'get the html form for submitting the matchmaking request / that supports polling' });
  });
  router.post('/start', function(req, res) {startMatchmakingHandler(properties, req, res)});
  return router
};

module.exports = routerClosure;
