var assert = require('assert');
    sinon = require('sinon'); // Using for making assertions about method calls.
    queue = require('../queue');

describe('queue', function () {
  it('should init successfully', function (done) {
    var q = new queue.Queue();
    done();
  });

  it('should have head/tail attributes', function (done) {
    var q = new queue.Queue();
    assert(q.hasOwnProperty('head'))
    assert(q.hasOwnProperty('tail'))
    done();
  });

  it('should have enqueue and dequeue methods',function (done) {
    // Dequeue method
    var q = new queue.Queue();
    actual = typeof(q.dequeue);
    expected = 'function';
    assert(actual == expected);

    // Enqueue method
    actual = typeof(q.enqueue);
    expected = 'function';
    assert(actual == expected);
    done();
  });

  it('should return top of queue when dequeue is called',function (done) {
    var q = new queue.Queue();
    var node = new queue.Node('some data');
    q.head = node;
    actual = q.dequeue().data;
    expected = 'some data'
    assert(actual == expected);
    done();
  });

  it('should set head to node when empty and enqueue is called',function (done) {
    var q = new queue.Queue();
    var node = new queue.Node('some data');
    q.enqueue(node);
    actual = q.head;
    expected = node;
    assert(actual == expected);
    done();
  });

  it('should set tail to node when queue already has head and enqueue is called',function (done) {
    var q = new queue.Queue();
    var node = new queue.Node('some data');
    var node_two = new queue.Node('some other data');
    q.enqueue(node);
    q.enqueue(node_two);
    actual = q.tail;
    expected = node_two;
    assert(actual == expected);
    done();
  });

  it('should not error if queue is empty and dequeue is called',function (done) {
    var q = new queue.Queue();
    q.dequeue();
    done();
  });

  it('should return undefined if empty and dequeue is called',function (done) {
    var q = new queue.Queue();
    actual = q.dequeue();
    expected = undefined;
    assert(actual==expected);
    done();
  });

  it('should reset head when dequeue is called and queue is not empty after',function (done) {
    var q = new queue.Queue();
    var node_one = new queue.Node('node_one');
    var node_two = new queue.Node('node_two');
    q.enqueue(node_one);
    q.enqueue(node_two);
    q.dequeue();
    assert(q.head != undefined);
    done();
  });

  it('should fail if enqueue is not passed a node',function (done) {
    var q = new queue.Queue();
    var not_node = null;
    assert.throws( ()=>{q.enqueue(not_node)}, q.NotANodeError)
    done();
  });

  it('should have first enqueued node as head regardless of many other nodes enqueued',function (done) {
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    q.enqueue(first_node);
    for (var i=0; i<100; i++){
        var other_node = new queue.Node('other node '+ i);
        q.enqueue(other_node);
    }
    actual = q.dequeue();
    expected = first_node;
    assert(actual == expected);
    done();
  });

  it('Queue.tails previous should always be null ex_1',function (done) {
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    var other_node = new queue.Node('other node ');
    q.enqueue(first_node);
    q.enqueue(other_node);
    assert(q.tail.previous == null);
    done();
  });

  it('Queue.head.previous should always be null when more than one enqueued ex_1.',function (done) {
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    var other_node = new queue.Node('other node ');
    q.enqueue(first_node);
    q.enqueue(other_node);
    assert(q.head.previous != null);
    done();
  });

  it('Queue.head.previous should always be null when more than one enqueued ex_2',function (done) {
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    var other_node = new queue.Node('other node ');
    var other_node_ = new queue.Node('other other node ');
    q.enqueue(first_node);
    q.enqueue(other_node);
    q.enqueue(other_node_);
    assert(q.head.previous != null);
    done();
  });

  it('Queue.head.previous should always be null when more than one enqueued ex_3',function (done) {
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    var other_node = new queue.Node('other node ');
    var other_node_ = new queue.Node('other other node ');
    q.enqueue(first_node);
    q.enqueue(other_node);
    q.enqueue(other_node_);
    q.dequeue();
    assert(q.head.previous != null);
    done();
  });


  it('Should not have a circular reference',function (done) {
    /*
      I just want to check that no node will reference itself with
      it's previous or next connection.
    */
    var q = new queue.Queue();
    var first_node = new queue.Node('some data');
    var other_node = new queue.Node('other node ');
    var other_node_ = new queue.Node('other other node ');
    q.enqueue(first_node);
    q.enqueue(other_node);
    q.enqueue(other_node_);
    var node = q.head;
    var counter = 1;
    while (true){
      if (counter >3){
         throw(Error('There is a circular reference with your previous references'));
      }
      if (!node.previous){
        break;
      }
      node = node.previous;
      counter ++;
    }

    var node = q.tail;
    var counter = 1;
    while (true){
      if (counter >3){
         throw(Error('There is a circular reference with your next references'));
      }
      if (!node || !node.next){
        break;
      }
      node = node.previous;
      counter ++;
    }
    done();
  });


});


describe('genKeyLookup', function () {
  it('should init successfully', function (done) {
    var mmr_lookup = queue.genKeyLookup();
    done();
  });

});

describe('binRanges', function () {
  it('should init successfully', function (done) {
    var mmr_bins = queue.binRanges();
    done();
  });

  it('should be able to convert to a JSON', function (done) {
    /* I want to test that this is a dictionary. If it can convert
       to a JSON then it's probably a dictionary.
    */
    var mmr_bins = queue.binRanges();
    var mmr_bins = JSON.parse(JSON.stringify(mmr_bins));
    done();
  });

  it('should have values that are Queues', function (done) {
    // Check that all values have constructor.name == 'Queue'
    var mmr_bins = queue.binRanges();
    for (var key in mmr_bins){
      const actual = mmr_bins[key].constructor.name;
      const expected = 'Queue';
      assert(actual == expected);

    }
    done();

  });

});
