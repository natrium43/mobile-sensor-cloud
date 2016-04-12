var express = require('express');
var http = require('http').Server(app); // http server
var bodyParser = require("body-parser");
var db = require('./lib/database');
var cors = require('cors');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// tenant
app.get('/tenants', function(req, res, next) { db.getTenants(req, res); });
app.get('/tenants/:tenant', function(req, res, next) { db.getTenant(req, res); });
app.post('/tenants', function(req, res, next) { db.addTenant(req, res); });

// users
app.get('/tenants/:tenant/users', function(req, res, next) { db.getUsers(req, res); });
app.get('/tenants/:tenant/users/:email', function(req, res, next) { db.getUser(req, res); });
app.post('/users', function(req, res, next) { db.addUser(req, res); });
app.put('/tenants/:tenant/:account/:email', function(req, res, next) { db.updateUser(req, res); });

// owners
app.get('/owners/:email', function(req, res, next) { db.getOwner(req, res); });
app.put('/owners/:email', function(req, res, next) { db.updateOwner(req, res); });
app.post('/owners', function(req, res, next) { db.addOwner(req, res); });

//login
app.post('/authenticate', function(req, res, next) { db.authenticate(req, res); });

app.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});