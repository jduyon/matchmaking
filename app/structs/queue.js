class Node{
  constructor(data){
    this.next = null;
    this.previous = null;
    this.data = data;
  }
}

function createPlayerNode(id, mmr){
  return new Node({'id': id, 'mmr': mmr});
}

function NotANodeError(message,extra){
  Error.captureStackTrace(this, this.constructor);
  this.message = message;
  this.constructor.name;
  this.extra = extra;
}

class Queue{
  /*
    This is essentially a linked list implementation of a queue.
  */
  constructor(){
    this.head = null;
    this.tail = null;
  }

  enqueue(node){

    if (!node || !node.hasOwnProperty('data')){
      throw(new NotANodeError("No null/undefined nodes are allowed. \
        Must have data property."));
    }

    if(!this.tail && !this.head){
       // Empty queue
       this.head = node;
    }

    else if(!this.tail && this.head){
       // Only 1 enqueued 
       node.next = this.head;
       this.head.previous = node
       this.tail = node;
       
    }

    else{
       // More than 1 enqueued
       this.tail.previous = node
       node.next = this.tail;
       this.tail = node;
    }
  };

  dequeue(){
    /* Pop the head from the queue by changing head, previous, and
       next connections. Rely on GC to clean up unreferenced objects.
    */
    if (this.head){
      var node = this.head;

      if (this.head.previous){
        this.head.previous.next = null;
        this.head = this.head.previous;
      }
      else{
        this.head = null;
      }
      return node;
    }

  };

}


function genKeyLookup(){
  // Generate an array to lookup hard coded keys of bin ranges.
  // For example, index 800 should have the value: '751-1000'
  // TODO: Generate these bins based off of MMR freq data
  var key_array = [];
  for (i = 0; i < 751; i++){
    key_array.push('0-750');
  }
  for (i = 1; i < 251; i++){
    key_array.push('751-1000');
  }
  for (i = 1; i < 251; i++){
    key_array.push('10001-1250');
  }
  for (i = 1; i < 251; i++){
    key_array.push('1251-1500');
  }
  return key_array;
}

function binRanges(){
  // Create the bins (queues) for hard coded example MMR bin ranges.
  // TODO: Create these bins based off of MMR frequency data
  var first_range = new Queue();
  var second_range = new Queue();
  var third_range = new Queue();
  var fourth_range = new Queue();

  return {
    '0-750': first_range,
    '751-1000': second_range,
    '1001-1250': third_range,
    '1251-1500': fourth_range,
  }
}

module.exports.Queue = Queue
module.exports.Node = Node
module.exports.NotANodeError = NotANodeError
module.exports.binRanges = binRanges
module.exports.genKeyLookup = genKeyLookup
module.exports.createPlayerNode = createPlayerNode
