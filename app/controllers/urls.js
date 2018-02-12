// Routing methods for retrieving and updating user info
var router = require('express').Router();
var matchmaking = require('./matchmaking');
var startMatchmakingHandler = matchmaking.startMatchmakingHandler;
var statusHandler = matchmaking.statusHandler;
var updateStatusHandler = matchmaking.updateStatusHandler;

function getDataStoreManager(properties){
  var sc_manager = new matchmaking.SearchingClientsManager(properties);
  var pm_manager = new matchmaking.MatchPairingManager(properties);
  var ds_manager = new matchmaking.DataStoreManager(properties, sc_manager, pm_manager);
  return ds_manager;
}

// I wrapped the router module because I want properties to be created
// in the server module and passed to the matchmaking handler
function routerClosure(properties){
  ds_manager = getDataStoreManager(properties);
  router.get('/', (req, res) => {
    res.json({ response: 'get the html form for submitting the matchmaking request / that supports polling' });
  });
  router.post('/start', function(req, res) {startMatchmakingHandler(properties, ds_manager, req, res)});
  router.post('/status', function(req, res) {statusHandler(properties, ds_manager, req, res)});
  router.post('/update', function(req, res) {updateStatusHandler(properties, ds_manager, req, res)});

  return router
};

module.exports = routerClosure;
