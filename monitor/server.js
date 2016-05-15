var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');
var logger = require('./routes/logger');
var resources = require('./routes/resources');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/sensor_db') ;
var Schema = mongoose.Schema;

var sensorSchema = new Schema({
  value:{ type:Number, default:0},
  format:{type:String, default:"default"},
  id:{type:Number,required:true,unique:true},
  description:{type:String},
  type:{type:String},
  groupId:{type:Number},
  users:{type:Array,default:[]},
  admin:{type:String,default:'Undefined'},
  status:{type:String,default:'Undefined'},
  owner:{type:String,default:'Undefined'},
  templateId:{type:Number}

});
var Sensor = mongoose.model('Sensor',sensorSchema);

io.on('connection', function(socket){
  console.log('connection received from Provisioning/Virtual Sensor');
  // To get messages from Provisioning server
  socket.on('eventToClient',function(data) {
    var id = data.id
    Sensor.findOne({id: id}, function (err, doc) {
      if (!err)
        socket.emit('reply',{result:doc, resKey: data.resKey});
      else 
        socket.emit('reply',{'error':'500'})

    })
  });

  // monitor and log events from provisioning server
  socket.on('sensorLog', function(data) {
    logger.newEvent(data.body, function(response) {
      if (!response) {
        console.log("an error has occurred while logging sensor event.");
      }
    });
  });

  // monitor and log events for resource management
  socket.on('resourceLog', function(data) {
    resources.newEvent(data.body, function(response) {
      if (!response) {
        console.log("an error has occurred while logging resource event.");
      }
    });
  });
});

/*
PAYLOAD: {
  'tenant': 'sjsu',
  'email': 'keith.ngo@sjsu.edu',
  'message': 'description of the activity we are logging',
  'sensor_id': 1001
}
*/
app.post('/monitor/sensors', function (req, res) {
  logger.newEvent(req.body, function(response) {
    if (response == false) {
      res.status(400).send();
      return;
    }

    res.status(201).send();
  });
});

/*
RESPONSE: {
  "message": "New sensor object for SensorID#100 has been provisioned ( or terminated/disabled/enabled).",
  "timestamp": "2016-05-07T22:10:32.470Z",
  "data": {
    'tenant': 'sjsu',
    'email': 'keith.ngo@sjsu.edu',
    'sensor_id': 1001
  }
}
*/
app.get('/monitor/sensors/:sensor_id', function (req, res) {
  var sensorId = req.params.sensor_id;
  logger.getEvents(sensorId, function(response) {
    if (response == null) {
      res.status(400).send();
      return;
    }

    res.send(response);
  });
});

// get log for sensors
app.get('/monitor/sensors', function (req, res) {
  logger.getAllEvents(function(response) {
    if (response == null) {
      res.status(400).send();
      return;
    }

    res.send(response);
  });
});

// get log for resource management
app.get('/monitor/resources', function (req, res) {
  resources.getAllEvents(function(response) {
    if (response == null) {
      res.status(400).send();
      return;
    }

    res.send(response);
  });
});

// monitor resource management
app.post('/monitor/resources', function (req, res) {
  resources.newEvent(req.body, function(response) {
    if (response == false) {
      res.status(400).send();
      return;
    }

    res.status(201).send();
  });
});

server.listen(3003, function(){
  console.log('socket.io server listening on *:3003');
});

