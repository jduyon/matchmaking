var queue = require('./structs/queue');
var BINNED_QUEUES = queue.binRanges();
var ENQUEUED_PLAYERS = new Set();
var DEQUEUED_PLAYERS = {}
var MMR_LOOKUP = queue.genKeyLookup();
var PROPERTIES = new Object();

PROPERTIES.MMR_LOOKUP = MMR_LOOKUP;
PROPERTIES.BINNED_QUEUES = BINNED_QUEUES;
PROPERTIES.ENQUEUED_PLAYERS = ENQUEUED_PLAYERS;
PROPERTIES.DEQUEUED_PLAYERS = DEQUEUED_PLAYERS;
//TODO: I'm assigning a function like this because I need
// DataStoreManager to be able to create nodes to add to the queue.
// I don't like doing this, and I should refactor the queue module
// or write a node manager class that ds_manager could use instead.
PROPERTIES.createPlayerNode = queue.createPlayerNode;
module.exports = PROPERTIES;
