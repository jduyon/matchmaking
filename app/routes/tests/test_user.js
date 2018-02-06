var assert = require('assert');
    user_router = require('../user');
    http = require('http');
    config = require('../../../config');
    hostname = config.host;
    port = config.port;
    server = require('../../server');

describe('server', function () {
  var app;
  before(function () {
    app = server.listen(port,hostname);
  });

  after(function () {
    app.close();
  });

  //TODO: These are  just an example tests.
  // Update this test when I change the functionality.
  it('should say Hello world when requesting /user/', function (done) {
    var url = 'http://' + hostname + ':' + port + '/user/';
    http.get(url, function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        assert.equal('Hello world', data);
        done();

      });
    });
  });

  it('should return 200', function (done) {
    var url = 'http://' + hostname + ':' + port;
    http.get(url, function (res) {
      assert.equal(200, res.statusCode);
      done();
    });
  });

});

