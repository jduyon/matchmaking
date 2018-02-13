var assert = require('assert');
    mm = require('../matchmaking');
    queue = require('../../structs/queue');
    http = require('http');
    config = require('../../../config');
    hostname = config.host;
    port = config.port;
    sinon = require('sinon');

describe('updateStatusHandler response and status code tests', function () {
  /*
    The update status handler is used to tell the server that a client has
    received the match information it needs. After the client updates with the
    server, the server can "forget" about the client. Once "forgotten" the 
    client may restart the matchmaking service.

    Note: Ideally, updateStatusHandlershould be called once a match is finished.
          Otherwise a client could be matched in multiple tournaments at the
          same time.
  */

  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
    /* Setup fake request and response objects for 2 clients */
    sc_manager = new mm.SearchingClientsManager(this.properties);
    pm_manager = new mm.MatchPairingManager(this.properties);
    this.ds_manager = new mm.DataStoreManager(this.properties, sc_manager, pm_manager);
    this.request_one = {
      'body':{'id':1,'mmr':0}
    };
    this.request_two= {
      'body':{'id':2,'mmr':0}
    };
    this.response_one = {};
    this.response_one.send = function(){};
    this.response_one.status = function(){};
    this.response_one.json = function(){};
    this.response_one.end = function(){};
    this.response_two = {};
    this.response_two.send = function(){};
    this.response_two.status = function(){};
    this.response_two.json = function(){};
    this.response_two.end = function(){};
  });
  afterEach(function () {
    sandbox.restore();
  });
  it('an example use case of updateStatusHandler', function(done){
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    done();
  });

  it('test 200 status code returned when player was paired for a match', function(done){
    this.properties.DEQUEUED_PLAYERS['1'] = '2';
    mock_resp = sinon.stub(this.response_one, 'status');
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 200);
    done();
  });

  it('test 404 status code returned when player has not been paired for a match', function(done){
    mock_resp = sinon.stub(this.response_one, 'status');
    this.properties.ENQUEUED_PLAYERS.add(1);
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 404);
    done();
  });

  it('test 404 status code returned when player has not been enqueud or not paired for a match', function(done){
    mock_resp = sinon.stub(this.response_one, 'status');
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 404);
    done();
  });

});



describe('statusHandler method call tests', function () {

  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
    sc_manager = new mm.SearchingClientsManager(this.properties);
    pm_manager = new mm.MatchPairingManager(this.properties);
    this.ds_manager = new mm.DataStoreManager(this.properties, sc_manager, pm_manager);
    /* Setup fake request and response objects for 2 clients */
    this.request_one = {
      'body':{'id':1,'mmr':0}
    };
    this.request_two= {
      'body':{'id':2,'mmr':0}
    };
    this.response_one = {};
    this.response_one.send = function(){};
    this.response_one.status = function(){};
    this.response_one.json = function(){};
    this.response_one.end = function(){};
    this.response_two = {};
    this.response_two.send = function(){};
    this.response_two.status = function(){};
    this.response_two.json = function(){};
    this.response_two.end = function(){};
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('test that statusHandler calls hasBeenDequeued', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_hbd.calledOnce);
    done();
  });

  it('test that statusHandler hasBeenDequeued args', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_hbd.calledWith(this.request_one.body.id));
    done();
  });

  it('test that statusHandler calls removeQueuedInfo when hasBeenDequeued', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mock_rmq = sinon.stub(this.ds_manager, 'removeQueuedInfo');
    mock_hbd.returns(true);
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_rmq.calledOnce);
    done();
  });

  it('test that statusHandler removeQueuedInfo call args', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mock_rmq = sinon.stub(this.ds_manager, 'removeQueuedInfo');
    mock_hbd.returns(true);
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_rmq.calledWith(this.request_one.body.id));
    done();
  });

  it('test that statusHandler doesnt call removeQueuedInfo when not dequeued', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mock_rmq = sinon.stub(this.ds_manager, 'removeQueuedInfo');
    mock_hbd.returns(false);
    mm.updateStatusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(!mock_rmq.called);
    done();
  });

});
