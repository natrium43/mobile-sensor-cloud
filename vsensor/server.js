var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var http_request = require('request');
var schedule = require('node-schedule');
var requestApi = require('request');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// connect to monitoring server
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3003', {reconnect: true});
socket.on('connect', function (socket) {
    console.log('Connected to Monitoring Server!');
});

// send event to monitor server
function SENSOR_LOG(body) {
    socket.emit('sensorLog',{ body: body });
}

var connSensorResult = mongoose.createConnection('mongodb://localhost/sensoresults_db');
var connObjectSensors = mongoose.createConnection('mongodb://localhost/sensorObject_db');

var Schema = mongoose.Schema;

var sensorResults = new Schema({
    RequestId:{type:Number,required:true},
    DateObserved: {type:String},
    HourObserved: {type:Number},
    LocalTimeZone: {type:String},
    ReportingArea: {type:String},
    StateCode: {type:String},
    Latitude: {type:Number},
    Longitude: {type:Number},
    ParameterName: {type:String},
    AQI: {type:Number},
    Category: {
        Number: {type:Number},
        Name: {type:String}
    }
});
var SensorObjectRes = connSensorResult.model('SensorObjectRes', sensorResults)

var sensorObjectSchema = new Schema({
  objId: {type: Number, required: true},
  sensorId: {type: Number, required: true},
  status: {type: String, required: true},
  type: {type: String, default: "Air Quality" },
  api: {type: String},
  usage: {type: Number , default: 0}
});

var SensorObject = connObjectSensors.model('SensorObject', sensorObjectSchema)

module.export = SensorObjectRes;
module.export = SensorObject;

function sensorObject (reqid, sensorid, api) {
  this.objId = reqid;
  this.sensorId = sensorid;
  this.api = api;
  this.status = 'Active';
  this.type = 'Air Quality';
  this.usage = 0;
}


//API: return sensor status
app.get('/SensorStatus/:requestId', function (req, res) {
  var params = req.params;
  console.log("Server recieved a GET /SensorStatus/" + params.requestId + " request");
  SensorObject.findOne({objId: parseInt(params.requestId)}, function (err, data) {
    if (err) {
      res.status(400).send();
      return console.error(err);
    }
    res.json({'status': data.status});
  });
});

//API:To create Sensor Objects when user requests for template
app.post('/ProvisionTemplate', function (req, res) {
  var payload = req.body;
  console.log("Server recieved a POST /ProvisionTemplate request");
  console.log("Payload: " + JSON.stringify(payload));
  var user1 = new sensorObject(payload.requestId, payload.sensorId, payload.api);
  var newSensorObject = new SensorObject(user1);
  newSensorObject.save(function (err, data) {
    if (err)  {
      SENSOR_LOG({
        'message': 'An error has occurred while provisioning Request ID/Sensor Object #' + payload.requestId,
        'sensor_id': payload.sensorId
      });
      res.status(400).send();
      return console.log("error updating");
    }

    // add provisioned object to scheduler
    SCHEDULER.add(payload.requestId, payload.api);
    SENSOR_LOG({
      'message': 'Request ID/Sensor Object #' + payload.requestId + " successfully PROVISIONED. (Status: 'Active')",
      'sensor_id': payload.sensorId
    });
    console.log(JSON.stringify(data));
    res.send();
  })
});

//API:To disable Sensor Objects from collecting the data from API
app.get('/DisableSensorObject/:reqid', function (req, res) {
  var reqid = req.params.reqid;
  var update = {status: "Inactive"};
  console.log("Server recieved a GET /DisableSensorObject/" + reqid + " request");
  SensorObject.findOneAndUpdate({objId: parseInt(reqid)}, {$set: update}, {upsert: true}, function (err, data) {
    if (err) {
      SENSOR_LOG({
        'message': 'An error has occurred while disabling Request ID/Sensor Object #' + reqid,
        'sensor_id': data.sensorId
      });
      res.status(400).send();
      return console.error(err);
    }

    // remove job from scheduler
    SCHEDULER.remove(reqid);
    SENSOR_LOG({
      'message': 'Request ID/Sensor Object #' + reqid + " successfully DISABLED.  (Status: 'Inactive')",
      'sensor_id': data.sensorId
    });
    console.log("Updated Successfully");
    res.send();
  });
});

//API:To enable Sensor Objects from collecting the data from API
app.get('/EnableSensorObject/:reqid', function (req, res) {
  var reqid = req.params.reqid;
  var update = {status: "Active"};
  console.log("Server recieved a GET /EnableSensorObject/" + reqid + " request");
  SensorObject.findOneAndUpdate({objId: parseInt(reqid)}, {$set: update}, {upsert: true}, function (err, data) {
    if (err) {
      SENSOR_LOG({
        'message': 'An error has occurred while enabling Request ID/Sensor Object #' + reqid,
        'sensor_id': data.sensorId
      });
      res.status(400).send();
      return console.error(err);
    }

    // remove job from scheduler
    SCHEDULER.add(reqid, data.api);
    SENSOR_LOG({
      'message': 'Request ID/Sensor Object #' + reqid + " successfully ENABLED.  (Status: 'Active')",
      'sensor_id': data.sensorId
    });
    console.log("Updated Successfully");
    res.send();
  });
});

//API:To terminate a  Sensor Objects
app.get('/TerminateSensorObject/:reqid', function (req, res) {
  var reqid = req.params.reqid;
  var update = {status: "Terminated"};
  console.log("Server recieved a GET /TerminateSensorObject/" + reqid + " request");
  SensorObject.findOneAndUpdate({objId: parseInt(reqid)}, {$set: update}, {upsert: true}, function (err, data) {
    if (err) {
      SENSOR_LOG({
        'message': 'An error has occurred while terminating Request ID/Sensor Object #' + reqid,
        'sensor_id': data.sensorId
      });
      res.status(400).send();
      return console.error(err);
    }

    // remove job from scheduler
    SCHEDULER.remove(reqid);
    SENSOR_LOG({
      'message': 'Request ID/Sensor Object #' + reqid + " successfully TERMINATED.  (Status: 'Terminated')",
      'sensor_id': data.sensorId
    });
    console.log("Updated Successfully");
    res.send();
  });
});

//API:To terminate a  Sensor Objects
app.get('/SensorObjectUsage/:reqid', function (req, res) {
  var params = req.params;
  console.log("Server recieved a GET /SensorObjectUsage/" + params.reqid + " request");
  SensorObject.findOne({objId: parseInt(params.reqid)}, function (err, data) {
    if (err) {
      res.status(400).send();
      return console.error(err);
    }
    res.send({
      requestId: data.objId,
      usage: data.usage
    });
  });
});

//API:To get values from db
app.get('/GetSensorFields/:reqid',function(req,res){
  var results =[]
  var query = SensorObjectRes.find({'RequestId': parseInt(req.params.reqid)}).select('RequestId DateObserved HourObserved LocalTimeZone ReportingArea StateCode Latitude Longitude ParameterName AQI Category -_id')
  query.exec(function(err,data){
    if(err){
      console.log(err)
      res.status(400).send();
    }
    else{
      results.push(data);
      //console.log(data);
      res.send(data);
    }
  });
})

/* 
USAGE:

SCHEDULER.init() - initialize any existing jobs when server starts up
SCHEDULER.add(requestId, api) - add a job to schedule
SCHEDULER.remove(requestId) - remove a job from schedule
SCHEDULER.get(requestId) - get an existing job from schedule
SCHEDULER.print() - print out jobs in schedule
*/ 

// Using UTC datetime
var SCHEDULER = {
  _jobs: {}, // used to keep track of jobs

  // default schedule rule
  _rule: function() {
    var rule = new schedule.RecurrenceRule();
    rule.minute = 59; // excute job every 59 minutes after the hour
    return rule;
  },

  // add job to schedule
  add: function(requestId, api) {
    var job = schedule.scheduleJob(this._rule(), function() {
      console.log("*** Running scheduled job *** [" + new Date() + "] Request ID: " + requestId + " | Air API: " + api);
      
      // collect data
      requestApi(api, function(error,response,body){
        if(!error&&response.statusCode == 200) {
          var jsonObjects = JSON.parse(body);
          console.log("Length of Json objects: "+jsonObjects.length);
          for(var jsonObjIter in jsonObjects) {
            //console.log("categories"+jsonObjects[jsonObjIter].Category.Name)
            var sensorData = new SensorObjectRes({"RequestId":requestId,"DateObserved":jsonObjects[jsonObjIter].DateObserved,
                "HourObserved":jsonObjects[jsonObjIter].HourObserved,"LocalTimeZone":jsonObjects[jsonObjIter].LocalTimeZone,
                "ReportingArea":jsonObjects[jsonObjIter].ReportingArea,"StateCode":jsonObjects[jsonObjIter].StateCode,
                "Latitude":jsonObjects[jsonObjIter].Latitude,"Longitude":jsonObjects[jsonObjIter].Longitude,
                "ParameterName":jsonObjects[jsonObjIter].ParameterName,"AQI":jsonObjects[jsonObjIter].AQI,"Category":jsonObjects[jsonObjIter].Category});
            sensorData.save(function(error,data){
              if (error)  {
                SENSOR_LOG({
                  'message': 'An error has occurred while saving data for Request ID: ' + requestId,
                  'sensor_id': data.sensorId
                });
                console.log(err);
                return;
              } else {
                console.log("Data successfully collected for Request ID: " + requestId);
              }
            });
          }
        } else {
          console.log('An error has occurred while collecting data for Request ID: ' + requestId);
          console.log(error)
        }
      });
      
      // increment usage hour for sensor object
      var update = {usage: 1};
      SensorObject.findOneAndUpdate({objId: parseInt(requestId)}, {$inc: update}, {upsert: true}, function (err, data) {
        if (err) {
          console.error(err);
          return;
        }
        console.log("Incremented usage hour for request ID: " + requestId);
      });
    });

    this._jobs[requestId] = job; // keep track of jobs by request id
    console.log("Added scheduled job for Request ID: " + requestId);
  },

  // remove job from schedule
  remove: function(requestId) {
    var job = this.get(requestId);
    if (job) {
      job.cancel();
      delete this._jobs[requestId];
      console.log("Deleted schedule job for Request ID: " + requestId);
    } else {
      console.log("INFO: no schedule job found for Request ID: " + requestId);
    }
  },

  // get a job from schedule
  get: function(requestId) {
    return (this._jobs.hasOwnProperty(requestId)) ? this._jobs[requestId] : null;
  },

  print: function() {
    console.log("Scheduled Jobs =>");
    for (var prop in this._jobs) {
      console.log("\tRequest ID: " + prop);
    }
  },

  // start up any 'Active' sensor objects in database on server startup
  init: function() {
    SensorObject.find(function (err, data) {
      if (err) {
        console.log("ERROR: failed to query for existing sensor objects on server startup.");
        return console.error(err);
      }
      
      for (var i = 0; i < data.length; i++) {
        var sensorObj = data[i];
        if (sensorObj.status === 'Active') {
          SCHEDULER.add(sensorObj.objId, sensorObj.api);
        }
      }
      SCHEDULER.print();
    });
  }
};

SCHEDULER.init();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(3004, function () {
  console.log('Example app listening on port 3004!');
});

module.exports = app;
