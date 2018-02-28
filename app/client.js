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
  completeMatch(){
    var this_class = this;
    new Promise(function(resolve, reject) {
      console.log('Starting mm');
      this_class.startMatchmakingSearch(resolve, reject);
    })
    .then(function(result){
      console.log('Now in queue');
      console.log('Starting polling');
      return new Promise(function(resolve, reject) {
        this_class.pollStatus(resolve, reject);
      })
    })
    .then(function(result){
      console.log('Finished polling');
      console.log('Starting update');
      return new Promise(function(resolve, reject) {
        this_class.updateStatus(resolve, reject);
      })
    })
    .then(function(result){
      console.log('Finished updating');
    })
    .catch(err =>function(err){throw('Failed somewhere' +err + this_class.id)})

  }
  requestRetry(options,max_retries, delay, condition, resolve, reject){
    /* Make a request until a condition is met */
    var counter = 0;
    function run(resolve, reject, id){
      var req = request(options, function(err, res, body){
        if (err || !condition(res.statusCode, id)){
          ++counter;
          if (counter >= max_retries){
            //console.log(err);
            //console.log(res)
            //console.log("rejected");
            reject("Failed condition or max retries");
          }
          else{
            //console.log('retrying'+delay)
            return new Promise(function(resolve, reject){setTimeout(run, delay, resolve, reject, id)//run(resolve, reject), delay)
            }).catch(err => function(err){throw('Failed retry req' +err)})
              //new Promise(function(resolve, reject){
              //setTimeout(run(resolve, reject), delay)
            //}).catch(err => function(err){throw('Failed retry req' +err)})
          }
        }
        else{
          //console.log('success');
          //console.log(res.statusCode)
          return resolve();
        }
        });
    }
    return run(resolve, reject, this.id);
  }

  startMatchmakingSearch(resolve, reject){
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
    var delay = 5000; // 1 second
    // Requesting to start mm should happen immediately. If it doesn't happen
    // after 10 seconds there's probably something wrong
    var result = this.requestRetry(options, retries, delay, condition, resolve, reject);

    return result
  }

  pollStatus(resolve, reject){
    const options = {
      url: 'http://' + hostname + ':' + port + '/status',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      },
      body: this.json,
    };
    function condition(statusCode, id){
      if (statusCode == 200){
        return true;
      }
      else if (statusCode == 202){
        //console.log('Poll: Keep polling, no match yet');
      }
      else if (statusCode == 404){
        console.log('Poll: Client not found', id);
        return false;
      }
      else{
        console.log('some other status', statusCode);
      }
    };

    var retries = 120; // 10 minutes total retries
    var delay = 5000; // 5 seconds
    // Polling is allowed to continue for 10 minutes
    // The client shouldn't wait longer than 10 minutes for a match.
    var result = this.requestRetry(options, retries, delay, condition, resolve, reject);

    return result
  }

  updateStatus(resolve, reject){
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
        console.log('Finished Updating!!!!!')
        return true;
      }
      else if(statusCode == 404){
        //console.log('Update: No match found..');
        return false;
        //throw('I am not in the queue');
      }
    };

    var retries = 100;
    var delay = 5000; // 1 second
    // Requesting to update your status should happen immediately. If it doesn't happen
    // after 10 seconds there's probably something wrong
    var result = this.requestRetry(options, retries, delay, condition, resolve, reject);

    return result
  }

}

for (var i=0; i<1000; i++){
  var x = new Client(i,'0');
  setTimeout(function(){x.completeMatch()}, 0);
}


