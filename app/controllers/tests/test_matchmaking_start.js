var assert = require('assert');
    mm = require('../matchmaking');
    queue = require('../../structs/queue');
    http = require('http');
    config = require('../../../config');
    hostname = config.host;
    port = config.port;
    server = require('../../server');
    sinon = require('sinon');


describe('Helper function unit tests (getters and setters)', function () {
  /*
    The manager classes all have specific "getSomething", "setSomething"
    functions which are wrappers around looking up and retrieving info from
    the data stores. This module is for testing those functions for each
    of those clases.
  */

  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('test getBinKey gets the bin key', function(done){
    var properties = new Object();
    properties.MMR_LOOKUP = ['This is an example of a binned queues key'];
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    actual = ds_manager.getBinKey(0);
    expected = 'This is an example of a binned queues key'
    assert(actual == expected);
    done();
  });


  it('test getEnqueued example', function(done){
    var properties = new Object();
    properties.ENQUEUED_PLAYERS = new Set(['an example']);
    var sc_manager = new mm.SearchingClientsManager(properties);
    actual = sc_manager.getEnqueued('an example');
    expected = true;
    assert(actual == expected);
    done();
  });

  it('test getEnqueued calls "has" on searching players set', function(done){
    var properties = new Object();
    var mock_set = sinon.stub();
    properties.ENQUEUED_PLAYERS = sinon.stub();
    properties.ENQUEUED_PLAYERS.has = mock_set;
    var sc_manager = new mm.SearchingClientsManager(properties);
    sc_manager.getEnqueued('some_id');
    assert(mock_set.calledOnce);
    done();
  });

  it('test getEnqueued returns true when a player has been enqueued', function(done){
    var properties = new Object();
    var mock_set = sinon.stub();
    mock_set.returns(true);
    properties.ENQUEUED_PLAYERS = sinon.stub();
    properties.ENQUEUED_PLAYERS.has = mock_set;
    var sc_manager = new mm.SearchingClientsManager(properties);
    actual = sc_manager.getEnqueued('some_id');
    expected = true;
    assert(actual == expected);
    done();
  });

  it('test hasBeenDequeued example', function(done){
    var properties = new Object();
    properties.DEQUEUED_PLAYERS = {'example_id': 'paired_example_id'}
    var pm_manager = new mm.MatchPairingManager(properties);
    actual = pm_manager.hasBeenDequeued('example_id');
    expected = 'paired_example_id';
    assert(actual == expected);
    done();
  });

  it('test enqueuedToBin example', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    player_node = {'data':{'id':'1'}};
    ds_manager.enqueueToBin(bin_key, player_node);
    //this.properties.BINNED_QUEUES[bin_key].enqueue(player_node);
    done();
  });

  it('test enqueuedToBin calls enqueue method of queue', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    mock_q = sinon.stub();
    mock_q.enqueue = sinon.stub();
    this.properties.BINNED_QUEUES[bin_key] = mock_q;
    player_node = {'data':{'id':'1'}};
    ds_manager.enqueueToBin(bin_key, player_node);
    assert(mock_q.enqueue.calledOnce);
    done();
  });

  it('test enqueuedToBin calls enqueue method with correct args', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    mock_q = sinon.stub();
    mock_q.enqueue = sinon.stub();
    this.properties.BINNED_QUEUES[bin_key] = mock_q;
    player_node = {'data':{'id':'1'}};
    ds_manager.enqueueToBin(bin_key, player_node);
    assert(mock_q.enqueue.calledWith(player_node));
    done();
  });

});

describe('DataStoreManager unit tests', function () {
  /*
    Besides the getter/setter functions already tested above ^, this will
    test the other functions ('getBinnedCompetitor and 'enqueueId'). I'm
    essentially testing the order of getters/setter calls and that they
    are used under certain circumstances.
  */

  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
  });

  afterEach(function () {
    sandbox.restore();
  });
  it('test getBinnedCompetitor example', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    ds_manager.getBinnedCompetitor(bin_key, id)
    done();
  });

  it('test getBinnedCompetitor calls isQueueHead once', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    ds_manager.getBinnedCompetitor(bin_key, id)
    assert(iqh.calledWith(bin_key, id));
    done();
  });

  it('test getBinnedCompetitor calls isQueueHead first', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    var dq_bin = sinon.stub(ds_manager, 'dequeueFromBin');
    ds_manager.getBinnedCompetitor(bin_key, id)
    sinon.assert.callOrder(iqh, dq_bin);
    done();
  });

  it('test getBinnedCompetitor does not call setDequeued if client is head', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    var set_dq = sinon.stub(pm_manager, 'setDequeued');
    iqh.returns(true);
    ds_manager.getBinnedCompetitor(bin_key, id)
    assert(set_dq.notCalled);
    done();
  });

  it('test getBinnedCompetitor calls setEnqueued twice if dequeues a client', function(done){
    /*
      getBinnedCompetitor is the only method which makes the call to dequeue
      a client (dequeue === finding a pair for a match). When this happens,
      I want to make sure that the service keeps track of both clients.
      setDequeued should be called for both clients.
    */
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    var dq_bin = sinon.stub(ds_manager, 'dequeueFromBin');
    var set_dq = sinon.stub(pm_manager, 'setDequeued');

    iqh.returns(false);
    dq_bin.returns({'data':{'id':'some_id'}});
    ds_manager.getBinnedCompetitor(bin_key, id)
    sinon.assert.calledTwice(set_dq);
    done();
  });


  it('test getBinnedCompetitor calls setEnqueued with both clients info', function(done){
    /*
      getBinnedCompetitor is the only method which makes the call to dequeue
      a client (dequeue === finding a pair for a match). When this happens,
      I want to make sure that the service keeps track of both clients.
      setDequeued should be called for with both clients' info. It's also
      important to understand that when the startMatchmakingWrapper
      is called with the API and if a client has been "setDequeued", the
      service doesn't try to queue that client.. and will send a 200 status
    */
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    var dq_bin = sinon.stub(ds_manager, 'dequeueFromBin');
    var set_dq = sinon.stub(pm_manager, 'setDequeued');

    iqh.returns(false);
    dq_bin.returns({'data':{'id':'some_id'}});
    ds_manager.getBinnedCompetitor(bin_key, id)
    assert(set_dq.withArgs(id, 'some_id').calledOnce)
    assert(set_dq.withArgs('some_id', id).calledOnce)
    done();
  });

  it('test getBinnedCompetitor does not call setEnqueued case', function(done){
    /*
      When getBinnedCompetitor doesn't find another client in the queue,
      make sure it doesn't setDequeue.
    */
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1'
    var iqh = sinon.stub(ds_manager,'isQueueHead');
    var dq_bin = sinon.stub(ds_manager, 'dequeueFromBin');
    var set_dq = sinon.stub(pm_manager, 'setDequeued');
    iqh.returns(false);
    dq_bin.returns(undefined);
    ds_manager.getBinnedCompetitor(bin_key, id)
    assert(set_dq.notCalled);
    done();
  });


  it('test enqueueId example', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ds_manager.enqueueId(bin_key, id, mmr)
    done();
  });

  it('test enqueueId calls getEnqueued', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(ge.calledOnce);
    done();
  });

  it('test enqueueId does not mark client as enqueued when getEnqueue returns true', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(sc_manager, 'setEnqueued');
    ge.returns(true);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.notCalled);
    done();
  });

  it('test enqueueId does not create player node when getEnqueue returns true', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(ds_manager, 'createPlayerNode');
    ge.returns(true);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.notCalled);
    done();
  });

  it('test enqueueId does not enqueue a client when getEnqueue returns true', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(ds_manager, 'enqueueToBin');
    ge.returns(true);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.notCalled);
    done();
  });

  it('test enqueueId does mark client as enqueued when getEnqueue returns false', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(sc_manager, 'setEnqueued');
    ge.returns(false);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.calledOnce);
    done();
  });

  it('test enqueueId does create player node when getEnqueue returns false', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(ds_manager, 'createPlayerNode');
    set_enq.returns({'data':{'id':id}})
    ge.returns(false);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.calledOnce);
    done();
  });

  it('test enqueueId does enqueue a client when getEnqueue returns false', function(done){
    var properties = this.properties;
    var sc_manager = new mm.SearchingClientsManager(properties);
    var pm_manager = new mm.MatchPairingManager(properties);
    var ds_manager = new mm.DataStoreManager(properties, sc_manager, pm_manager);
    bin_key = '0-750';
    id = '1';
    mmr = 750;
    ge = sinon.stub(sc_manager, 'getEnqueued');
    set_enq = sinon.stub(ds_manager, 'enqueueToBin');
    ge.returns(false);
    ds_manager.enqueueId(bin_key, id, mmr)
    assert(set_enq.calledOnce);
    done();
  });

});





//TODO: Fix these tests setup properties correctly, implement status/udpate handlers
describe('Matchmaking API full example', function () {
  before(function () {
    /* Setup fake request and response objects for 2 clients */
    this.request_one = {
      'body':{'id':1,'mmr':750}
    };
    this.request_two= {
      'body':{'id':2,'mmr':750}
    };
    this.response_one = {};
    this.response_one.send = function(){};
    this.response_one.status = function(){};
    this.response_one.json = function(){};
    this.response_two = {};
    this.response_two.send = function(){};
    this.response_two.status = function(){};
    this.response_two.json = function(){};
  });

  it('test that a full example has no errors.', function(done){
    // First client starts matchmaking
    mm.startMatchmakingHandler(this.request_one, this.response_one);
    // Second client starts matchmaking
    mm.startMatchmakingHandler(this.request_two, this.response_two);
    // Both clients poll their status
    mm.statusHandler(this.request_one, this.response_one);
    mm.statusHandler(this.request_two, this.response_two);
    // They should have been matched together. Now they have necessary
    // info about their match and should update their status.
    // Once updated, they can start another matchmaking request.
    mm.updateStatusHandler(this.request_one, this.response_one);
    mm.updateStatusHandler(this.request_two, this.response_two);
    done();
  })

});

//TODO: Fix these tests setup properties correctly
describe('startMatchmakingHandler', function () {;
  var sandbox;
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    this.properties = new Object();
    this.properties.BINNED_QUEUES = {'0-750':new queue.Queue()};
    this.properties.ENQUEUED_PLAYERS = new Set();
    this.properties.DEQUEUED_PLAYERS = {};
    this.properties.MMR_LOOKUP = ['0-750'];
    /* Setup fake request and response objects for 2 clients */
    this.request_one = {
      'body':{'id':1,'mmr':750}
    };
    this.request_two= {
      'body':{'id':2,'mmr':750}
    };
    this.response_one = {};
    this.response_one.send = function(){};
    this.response_one.status = function(){};
    this.response_one.json = function(){};
    this.response_two = {};
    this.response_two.send = function(){};
    this.response_two.status = function(){};
    this.response_two.json = function(){};
    this.mock_status_one = sinon.spy(this.response_one,'status');
    this.mock_status_two = sinon.spy(this.response_two,'status');
    this.mock_response_one = sinon.spy(this.response_one,'json');
    this.mock_response_two = sinon.spy(this.response_two,'json');

  });
  afterEach(function () {
    sandbox.restore();
  });
  it('test that binned queue is not empty after first start MM request', function(done){
    // Each binned queue starts as empty, it should queue the first
    // client that makes a startMatchmakingHandler request..
    mm.startMatchmakingHandler(this.request_one, this.response_one);
    assert(mm.PROPERTIES.BINNED_QUEUES['0-750'].head != null);
    done();
  });

  it('test that binned queue is empty after only two start MM requests', function(done){
    // Since two start mm requests are made, the binned queue will dequeue
    // the first request and pair it with the second.
    mm.startMatchmakingHandler(this.request_one, this.response_one);
    mm.startMatchmakingHandler(this.request_two, this.response_two);
    assert(mm.PROPERTIES.BINNED_QUEUES['0-750'].head == null);
    done();
  });

});

