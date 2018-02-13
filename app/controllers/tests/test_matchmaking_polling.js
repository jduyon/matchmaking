var assert = require('assert');
    mm = require('../matchmaking');
    queue = require('../../structs/queue');
    http = require('http');
    config = require('../../../config');
    hostname = config.host;
    port = config.port;
    sinon = require('sinon');

describe('statusHandler response and status code tests', function () {
  /*
    The status handler is used to ask the server if a client was
    paired for a match.
  */

  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
    this.properties.createPlayerNode = queue.createPlayerNode;
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

  it('an example use case of statusHandler', function(done){
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    done();
  });

  it('test 200 status code returned when player was paired for a match', function(done){
    this.properties.DEQUEUED_PLAYERS['1'] = '2';
    mock_resp = sinon.stub(this.response_one, 'status');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 200);
    done();
  });

  it('test competitor_id value in resp body when paired for a match', function(done){
    this.properties.DEQUEUED_PLAYERS['1'] = '2';
    mock_resp = sinon.stub(this.response_one, 'json');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    actual = mock_resp.args[0][0]['competitor_id']
    expected = '2'
    assert(actual == expected);
    done();
  });

  it('test that competitor_id is in resp body when paired for a match', function(done){
    this.properties.DEQUEUED_PLAYERS['1'] = '2';
    mock_resp = sinon.stub(this.response_one, 'json');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert('competitor_id' in mock_resp.args[0][0]);
    done();
  });

  it('test 202 status code returned when player is enqueued but not paired', function(done){
    this.properties.ENQUEUED_PLAYERS.add(1);
    mock_resp = sinon.stub(this.response_one, 'status');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 202);
    done();
  });

  it('test 404 status code returned when player is not enqueued and not paired', function(done){
    mock_resp = sinon.stub(this.response_one, 'status');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_resp.args[0][0] == 404);
    done();
  })


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
    this.properties.createPlayerNode = queue.createPlayerNode;
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
    this.response_one.end = function(){};
    this.response_two = {};
    this.response_two.send = function(){};
    this.response_two.status = function(){};
    this.response_two.json = function(){};
    this.response_two.end = function(){};
    this.response_two.end = function(){};
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('test that statusHandler calls hasBeenDequeued', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_hbd.calledOnce);
    done();
  });

  it('test that statusHandler hasBeenDequeued call args', function(done){
    mock_hbd = sinon.stub(this.ds_manager.pairing_manager, 'hasBeenDequeued');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_hbd.calledWith(this.request_one.body.id));
    done();
  });

  it('test that statusHandler calls getEnqueued', function(done){
    mock_gq = sinon.stub(this.ds_manager.searcher_manager, 'getEnqueued');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_gq.calledOnce);
    done();
  });

  it('test that statusHandler getEnqueued call args', function(done){
    mock_gq = sinon.stub(this.ds_manager.searcher_manager, 'getEnqueued');
    mm.statusHandler(this.properties, this.ds_manager, this.request_one, this.response_one);
    assert(mock_gq.calledWith(this.request_one.body.id));
    done();
  });

});
