// Routing methods for retrieving and updating user info
var router = require('express').Router();
router.get('/', function(req, res, next) {
  res.send('Hello world')
  // ..
});

module.exports = router;
