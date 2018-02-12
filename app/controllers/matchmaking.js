const util = require('util') // remove this

class SearchingClientsManager{
  constructor(properties){
    this.properties = properties;
  }
  setEnqueued(id){
    // Store people who are already on the queue.
    this.properties.ENQUEUED_PLAYERS.add(id);
  }
  getEnqueued(id){
    return this.properties.ENQUEUED_PLAYERS.has(id)
  }
  removeFromEnqueued(id){
    delete this.properties.ENQUEUED_PLAYERS.delete(id);
  }
}

class MatchPairingManager{
  constructor(properties){
    this.properties = properties;
  }
  setDequeued(id, opponent_id){
    // Store dequeued player & requestor's id
    this.properties.DEQUEUED_PLAYERS[opponent_id] = id
  }
  hasBeenDequeued(id){
    return this.properties.DEQUEUED_PLAYERS[id];
  }
  removeFromDequeued(id){
    delete this.properties.DEQUEUED_PLAYERS[id];
  }
}

class DataStoreManager{
  constructor(properties, searcher_manager, pairing_manager){
    this.properties = properties;
    this.searcher_manager = searcher_manager;
    this.pairing_manager = pairing_manager;
  }

  createPlayerNode(id, mmr){
    return this.properties.createPlayerNode(id,  mmr);
  }
  
  getBinKey(mmr){
    return this.properties.MMR_LOOKUP[mmr];
  }
  
  getQueueHead(bin_key){
    return this.properties.BINNED_QUEUES[bin_key].head
  }
  
  dequeueFromBin(bin_key){
    return this.properties.BINNED_QUEUES[bin_key].dequeue();
  }

  enqueueToBin(bin_key, player_node){
    this.properties.BINNED_QUEUES[bin_key].enqueue(player_node);
  }

  isQueueHead(bin_key, id){
    var top_of_queue = this.getQueueHead(bin_key);
    if (top_of_queue && top_of_queue.data.id == id){
      return true;
    }
  }

  removeQueuedInfo(id){
    /*
      Remove players from matching/searching player data store.
      Note: This doesn't remove players from the binned queue data structure.
    */
    this.pairing_manager.removeFromDequeued(id);
    this.searcher_manager.removeFromEnqueued(id);
  }
  
  getBinnedCompetitor(bin_key, id){
    // If you are at the top of queue, don't dequeue yourself
    // Otherwise you can be matched with yourself. This happens
    // if you are the only one in the queue.
    if (this.isQueueHead(bin_key, id)){
      return;
    }
  
    var dequeued = this.dequeueFromBin(bin_key);
    if (dequeued){
      // Add dequeud client to dequeued lookup as a key
      this.pairing_manager.setDequeued(id, dequeued.data['id']);
      // Add yourself to dequeud lookup as a key
      // Note: The client never calls this when they are already queued.
      this.pairing_manager.setDequeued(dequeued.data['id'], id);
    }

    return dequeued
  }

  enqueueId(bin_key, id, mmr){
    // Don't re-enqueue yourself
    if (!this.searcher_manager.getEnqueued(id)){
      this.searcher_manager.setEnqueued(id);
      var player = this.createPlayerNode(id,mmr);
      this.enqueueToBin(bin_key, player);
      return true;
    }
    else{
      return false;
    }
  }
}

class RouteHandler{
  constructor(properties, sc_mgr, mp_mgr, ds_mgr, req, res){
  }
}

function startMatchmakingHandler(properties, ds_manager, req, res){
  /*
     Check to see if there is already a match available for you. Otherwise
     add you to the queue.

     Note: You aren't actually "searching" the queue, because searching a
     queue costs O(n) time (at least in the worst case). You get added to the
     queue and wait "passively" for another player to dequeue you.

     There are a few cases you must consider before enqueueing yourself.
     - Have you been enqueued already, but were dequeued?
     - Have you been enqueued already?
     - Can I find a match for you without enqueuing you?

     If no to all of these ^ then I'll enqueue you.

  */
  var mmr = req.body.mmr;
  var id = req.body.id;
  var bin_key = ds_manager.getBinKey(mmr);
  var paired_id = ds_manager.pairing_manager.hasBeenDequeued(id)
  var is_queued = ds_manager.searcher_manager.getEnqueued(id);
  if (paired_id){
    res.status(200);
    res.json({response:'You were already queued, also, someone has matched with you'})
    res.end();
  }
  if (is_queued){
    res.status(403);
    res.json({response: 'You are already queued. Please wait for a match to be found.'})
    res.end();
  }

  else{
    var competitor = ds_manager.getBinnedCompetitor(bin_key, id);
    if (competitor){
      res.status(200);
      res.json({response: 'I have a match for you already, no need to be in the queue.'})
      res.end();
    }
    else{
      ds_manager.enqueueId(bin_key, id, mmr)
      res.status(200);
      res.json({response: 'You have been queued.'});
      res.end();
    }
  }

}

function statusHandler(properties, ds_manager, req, res){
  /*
    Request a client's status. If a match was made, tell client of opponent.
  */
  var mmr = req.body.mmr;
  var id = req.body.id;
  var competitor_matched = ds_manager.pairing_manager.hasBeenDequeued(id)
  var is_queued = ds_manager.searcher_manager.getEnqueued(id);

  if (competitor_matched){
    res.status(200);
    res.json({response:'A match was found', competitor_id:competitor_matched });
    res.end();
  }

  else if (!is_queued){
    res.status(404);
    res.json({response:'You were not found in our searching players pool.' });
    res.end();
  }

  else{
    res.status(202);
    res.json({response:'A match has not been found yet. Keep polling.' });
    res.end();
  }
}

function updateStatusHandler(properties, ds_manager, req, res){
  // Request to tell server you are ready
  // Will remove you from matched/searching players
  // Once this is called, a player can restart matchmaking
  // What if a user was enqueued but not matched and he runs this?
  // If a player runs this and hasn't been matched yet
  // they can re-queue without being removed from queue already.
  // NO ^ because if they were enqueued or dequeued you w
  var id = req.body.id;
  if (ds_manager.pairing_manager.hasBeenDequeued(id)){
    ds_manager.removeQueuedInfo(id);
    res.status(200);
    res.json({response:'You may now restart matchmaking service.'})
    res.end();
  }
  else{
    res.status(404);
    res.json({response:'You are not matched yet or not queued. \
      Check your status to make sure you are queued first, and then wait to be matched.'})
    res.end();
  }


}

module.exports.startMatchmakingHandler = startMatchmakingHandler;
module.exports.statusHandler = statusHandler;
module.exports.updateStatusHandler = updateStatusHandler;

module.exports.MatchPairingManager = MatchPairingManager;
module.exports.SearchingClientsManager = SearchingClientsManager;
module.exports.DataStoreManager = DataStoreManager;
