const config = require('../config');
const hostname = config.host;
const port = config.port;
var request = require('request');
//request.post(options, callback)

class Client{
  constructor(id, mmr){
    this.id = id;
    this.mmr = mmr;
    this.json = JSON.stringify({'id':this.id, 'mmr': this.mmr});
  }

  requestRetry(options,max_retries, delay, condition, callback){
    /* Make a request until a condition is met */
    var counter = 0;
    function run(){
      request(options, function(err, res, body){
        if (err || !condition(res.statusCode)){
          ++counter;
          if (counter >= max_retries){
            console.log(counter);
            callback(err);
          }
          else{
            setTimeout(run, delay);
          }
        }
        else{
          callback(null, res, body);
        }
        });
    }
    run();
  }

  async startMatchmakingSearch(){
    const options = {  
      url: 'http://' + hostname + ':' + port + '/start',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      body: this.json,
    };

    function condition(statusCode){
      if (statusCode == 200 || statusCode == 403){
        return true;
      }
    };

    var retries = 10;
    var delay = 1000; // 1 second
    // Requesting to start mm should happen immediately. If it doesn't happen
    // after 10 seconds there's probably something wrong
    var result = await this.requestRetry(options, retries, delay, condition, function(err,res, body ){
      if (err){
        throw(err);
      }
      else{
        return 'Request complete, I am in the queue.' + res.statusCode + body;
      }});

    return result
  }

  async pollStatus(){
    const options = {
      url: 'http://' + hostname + ':' + port + '/status',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: this.json,
    };

    function condition(statusCode){
      if (statusCode == 200){
        return true;
      }
      else if (statusCode == 404){
        throw('I have not been queued');
      }
    };

    var retries = 120; // 10 minutes total retries
    var delay = 5000; // 5 seconds
    // Polling is allowed to continue for 10 minutes
    // The client shouldn't wait longer than 10 minutes for a match.
    var result = await this.requestRetry(options, retries, delay, condition, function(err,res, body ){
      if (err){
        throw(err);
      }
      else{
        return 'Request complete, a match was found.' + res.statusCode + body;
      }
    });
    return result;
  }

  async updateStatus(){
    const options = {
      url: 'http://' + hostname + ':' + port + '/update',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: this.json,
    };
    function condition(statusCode){
      if (statusCode == 200){
        return true;
      }
      else if(statusCode == 404){
        throw('I am not in the queue');
      }
    };

    var retries = 10;
    var delay = 1000; // 1 second
    // Requesting to update your status should happen immediately. If it doesn't happen
    // after 10 seconds there's probably something wrong
    var result = await this.requestRetry(options, retries, delay, condition, function(err,res, body ){
      if (err){
        throw(err);
      }
      else{
        return 'Request complete, I am ready for a match.' + res.statusCode + body;
      }});

    return result
  }

  completeMatch(){
    /*
    Start matchmaking, poll until matched, then update status.
    */
    // If you use this inside a promise it refers to itself.
    var this_class = this;
    var start_promise = this.startMatchmakingSearch()
    start_promise.catch(function(error) {
      console.log(error);
    });
    start_promise.then(function(result){
      var poll_promise = this_class.pollStatus();
      poll_promise.catch(function(error) {
        console.log(error);
      });

      poll_promise.then(function(result){
        var update_promise = this_class.updateStatus();
        update_promise.catch(function(error) {
          console.log(error);
        });
      });
    });
  }    
}


var x = new Client('0','0');
var y = new Client('1','0');
x.completeMatch();
y.completeMatch();


