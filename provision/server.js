var express = require('express');
var app = express();
var path = require('path');
var AWS = require('aws-sdk');
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request_module = require('request');

//database connections
autoIncrement = require('mongoose-auto-increment');

//mongoose.connect('mongodb://localhost/sensor_db');
connSensor = mongoose.createConnection('mongodb://localhost/sensor_db');
connSensor.on('error', console.error.bind(console));
autoIncrement.initialize(connSensor);
var conn = mongoose.createConnection('mongodb://localhost/ec2Server_db');
var connUserSensors = mongoose.createConnection('mongodb://localhost/sensorUsers_db');
//database schema
var Schema = mongoose.Schema;
var sensorSchema = new Schema({
    value: {type: Number, default: 0},
    format: {type: String, default: "default"},
    id: {type: Number, required: true, unique: true},
    description: {type: String},
    type: {type: String},
    groupId: {type: Number},
    users: {type: Array, default: []},
    admin: {type: String, default: 'Undefined'},
    status: {type: String, default: 'Undefined'},
    owner: {type: String, default: 'Undefined'},
    templateFlag: {type: String, default: 'False'}
});
sensorSchema.plugin(autoIncrement.plugin, {model: 'Sensor', field: 'id', startAt: 100, incrementBy: 1});
var Sensor = connSensor.model('Sensor', sensorSchema);
/* To save records into Mongo
 */
var templateSchema = new Schema({
    templateId: {type: Number, required: true, unique: true},
    minSamplePeriod: {type: String, default: '1ms'},
    maxValue: {type: Number, default: 100},
    minValue: {type: Number, default: 0},
    responseTime: {type: Number},
    type: {type: String},
    availableFrom: {type: Date, default: Date.now},
    sensorId: {type: Number, required: true}
});
var Template = connSensor.model('Template', templateSchema);

var templateGroupSchema = new Schema({
    templateGroupId: {type: Number, required: true, unique: true},
    description: {type: String},
    sensorGroup: {type: Array},
    availableFrom: {type: Date, default: Date.now},
});
var TemplateGroup = connSensor.model('TemplateGroup', templateGroupSchema);

var ec2ServerSchema = new Schema({
    instanceId: {type: String, default: 0},
    instaceType: {type: String, default: "t2.micro"},
    active: {type: String, default: "Active"},
    AvailabilityZone: {type: String, default: "US-West-1c"},
    status: {type: String, required: true}
});
var EC2Server = conn.model('EC2Server', ec2ServerSchema)
var sensorUsersSchema = new Schema({
    reqId: {type: Number, required: true, unique: true},
    sensorId: {type: Number, required: true}
})
var SensorUser = connUserSensors.model('SensorUser', sensorUsersSchema)
module.exports = Sensor;
module.export = Template;
module.export = TemplateGroup;

function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.json());
app.set('views', path.join(__dirname, '/public/html'));
app.engine('html', require('ejs').renderFile); //specify which template engine to use
app.set('view engine', 'ejs');
/*
 * Make a json response and send it back to caller. The rendering in html/js is not taken care of, at this point.
 * If this is called from a controller, then controller itself must be called from an HTML, so that the results can be
 * rendered in a web page.
 */

//API :To get the whole sensorlist from mongodb
app.get('/sensorlist', function (req, res) {
    console.log("I recieved a GET /sensorlist request");
    Sensor.find(function (err, data) {
        if (err) {
          res.status(400).send();
          return console.error(err);
        }
        console.log(data);
        res.json(data)
    });
});
//API: To get list of user’s sensor statuses
app.get('/userSensors/:ids', function (req, res) {
    console.log("Server recieved a GET /usersensors request", req.params.ids);
    var reIDwithoutBracks = req.params.ids.slice(1, -1)
    var reqIdArray = new Array;
    reqIdArray = reIDwithoutBracks.split(",");
    console.log(reqIdArray)
    var result = [];
    reqIdArray.forEach(function (item, index) {
        var query = SensorUser.find({reqId: item}).select('sensorId -_id');
        query.exec(function (err, data) {
            if (err) {
                console.log(err)
                res.status(400).send();
            }
            else {
                console.log("The data obtained from sensor user table is" + data)
                var query = Sensor.find({
                    'id': {$in: data[0].toObject().sensorId}
                }).select('id status type -_id')
                query.exec(function (err, data) {
                    if (err) {
                        console.log(err)
                        res.status(400).send();
                    }
                    else {
                        result.push(data);
                        if (index === reqIdArray.length - 1) {
                            res.json(result);
                        }
                    }
                });
            }
        });
    })
});

//API: To get the list of sensors that have no templates associated with them
app.get('/untemplatedsensors', function (req, res) {
    console.log("Server recieved a GET /untemplatedsensors request");
    Sensor.find({'templateFlag': 'False'}, function (err, data) {
        if (err) {
            res.status(400).send();
            return;
        }
        console.log(data);
        res.json(data);
    })
});
//API: To get templatelist
app.get('/templatelist', function (req, res) {
    console.log("Server recieved a GET /templatelist request");
    Template.find(function (err, data) {
        if (err) {
          res.status(400).send();
          return console.error(err);
        }
        console.log(data);
        //res.render('view_templates.html',data);
        res.json(data);
    });
});
//API: Get template by id
app.get('/templatelist/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server recieved a GET /templatelist/" + id + " request");
    Template.findOne({templateId: parseInt(id)}, function (err, data) {
        if (err) {
          res.status(400).send();
          return console.error(err);
        }
        console.log(data);
        res.json(data);
    });
});
//API:To get a templategroup list
app.get('/templategrouplist', function (req, res) {
    console.log("Server recieved a GET /templategrouplist request");
    TemplateGroup.find(function (err, data) {
        if (err) {
          res.status(400).send();
          return console.error(err);
        }
        console.log(data);
        res.json(data);
    });
});
//API:To send sensor from frontend to mongodb
app.post('/sensorlist', function (req, res) {
    console.log(req.body);
    var newSensor = new Sensor(req.body);
    newSensor.save(function (err, data) {
        if (err) {
            res.status(400).send();
            return console.error(err);
        }
        SENSOR_LOG({
            'email': 'owner@sjsu.edu',
            'message': 'Owner registered new sensor. (Type: ' + req.body.type + ', Description: ' + req.body.description + ')',
            'sensor_id': req.body.id
        });
        console.log(data);
        res.json(data)
    });
});
//API: send templates from frontend to mongodb
app.post('/templatelist', function (req, res) {
    console.log(req.body);
    var newTemplate = new Template(req.body);
    newTemplate.save(function (err, data) {
        if (err) {
            res.status(400).send();
            return console.error(err);
        }
        //set flag in sensorDB
        Sensor.findOneAndUpdate({id: req.params.sensorId}, {$set: {templateFlag: "True"}}, {upsert: false}, function (err, doc) {
            if (err) {
              res.status(500).send({error: err});
              return;
            }
            //return res.json(doc);
            console.log("Successfully Updated");
        });
        console.log("End of templates");
        console.log(data);
        res.json(data);
    });
});
//To send template group from frontend to mongodb
app.post('/templategrouplist', function (req, res) {
    console.log(req.body);
    var newTemplate = new TemplateGroup(req.body);
    newTemplate.save(function (err, data) {
        if (err) {
            res.status(400).send();
            return console.error(err);
        }
        console.log(data);
        res.json(data);
    });
});
//API: To Delete sensor by id
app.delete('/sensorList/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server processing request to delete sensor with ID", id);
    Sensor.findOneAndRemove({id: id}, function (err) {
        if (err) {
            res.status(500).send({error: 'Could not find sensor ID in the db'});
            console.log("Could not Delete Sensor with id", id);
        }
        else {
            SENSOR_LOG({
                'email': 'owner@sjsu.edu',
                'message': 'Owner deleted sensor ID#' + id,
                'sensor_id': id
            });
            res.sendStatus(200);
            console.log("Deleted");
        }
    });
})
//Deletes template by id
app.delete('/templatelist/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server processing request to delete template with ID", id);
    Template.findOneAndRemove({templateId: id}, function (err) {
        if (err) {
            res.status(500).send({error: 'Could not find template ID in the db'});
            console.log("Could not Delete Sensor with id", _id);
        }
        else {
            res.sendStatus(200);
            console.log("Deleted");
        }
    });
})
//Deletes template grouplist by id
app.delete('/templategrouplist/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server processing request to delete template Group with ID", id);
    TemplateGroup.findOneAndRemove({templateGroupId: id}, function (err) {  //change this
        if (err) {
            res.status(500).send({error: 'Could not find template Group ID in the db'});
            console.log("Could not Delete Template Group with id", _id);
        }
        else {
            res.sendStatus(200);
            console.log("Deleted");
        }
    });
})
//API:Modify a template
app.put('/templatelist/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server got a PUT request for id", id);
    console.log(req.body);
    Template.findOneAndUpdate({templateId: id}, {$set: req.body}, {upsert: true}, function (err, doc) {
        if (err) return res.status(500).send({error: err});
        return res.json(doc);
        console.log("Successfully Updated");
    })

});
//API to get sensor data
app.get('/getAirData', function (req, res) {
    request_module('http://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=95131&distance=25&API_KEY=1035C2AC-CDB8-4540-97E4-0E8D82BA335A', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            res.send(body);
            return;
        }

        res.status(400).send();
    });
});

//view register sensor webpage
app.get('/register/sensor', function (req, res) {
    res.render('register_sensor.html'); //CHANGE this to the right page.
});
app.get('/save/template', function (req, res) {
    res.render('save_templates.html'); //CHANGE this to the right page.
});


//AWS Related functions
AWS.config.update({region: 'us-west-1'});
var ec2 = new AWS.EC2();

var paramsForCreation = {
    ImageId: 'ami-1b0f7d7b', // Amazon Linux AMI x86_64 EBS
    InstanceType: 't2.micro',//free tier eligible
    MinCount: 1, MaxCount: 1
};
//Create the instance'
//API to create EC2 servers
app.get('/createNewServer', function (req, resp) {
    console.log("Server got a request for EC2 Instance Creation");
    RESOURCE_LOG({
        'instance_id': 'n/a',
        'message': 'Attempting to create a new EC2 instance.'
    });
    ec2.runInstances(paramsForCreation, function (err, data) {
        if (err) {
            console.log("Could not create instance", err);
            RESOURCE_LOG({
                'instance_id': 'n/a',
                'message': 'Failed to create a new EC2 instance.'
            });
            return resp.status(500).send({error: err});
        }
        var instanceId = data.Instances[0].InstanceId;
        console.log("Created instance", instanceId);
        RESOURCE_LOG({
            'instance_id': 'n/a',
            'message': 'Successfully created new EC2 instance.'
        });
        EC2Server.find(function (err, data) {
            if (err){ console.log("Could not find EC2Server db");return resp.status(500).send({error: err});}
            console.log(data)
            data.forEach(function (record) {
                EC2Server.findOneAndUpdate({instanceId: record.instanceId}, {$set: {"active": "Inactive"}}, {upsert: false}, function (err, doc) {
                    if (err) return resp.status(500).send({error: err});
                    console.log("Successfully Updated server db");
                    // resp.sendStatus(200);
                });
            });
            var newEC2Server = new EC2Server({"instanceId": instanceId ,"status": "Running"});
            newEC2Server.save(function (err, data) {
                if (err)  return resp.status(500).send({error: err});
                console.log(data);
                resp.json(data)
            });
            // Add tags to the instance
            params = {
                Resources: [instanceId], Tags: [
                    {Key: 'Name', Value: 'instanceName'}
                ]
            };
            ec2.createTags(params, function (err) {
                console.log("Tagging instance", err ? "failure" : "success");
            });

        });
    });
});
//start instances saved in the database

function startInstances(instId, callback) {
    console.log("Server attempting to start instances");
    var instances = [];
    if (instId == 'all') {
        EC2Server.find(function (err, data) {
            if (err) return console.error(err);
            data.forEach(function (record) {
                console.log(record.instanceId);

                instances.push(record.instanceId);
            });
        });
    }
    else {
        instances.push(instId);
    }
    var paramsOldInstances = {
        InstanceIds: instances,
        DryRun: false
    };
    var result = 0;
    ec2.startInstances(paramsOldInstances, function (err, data) {
        if (err) {
            res.status(500).send({error: err});
        }
        else {
            EC2Server.find(function (err, data) {
                if (err) res.status(500).send({error: err});
                else {
                    data.forEach(function (record) {
                        EC2Server.findOneAndUpdate({instanceId: req.params.id}, {$set: {"status": "Sttarted"}}, {upsert: true}, function (err, doc) {
                            if (err) return res.status(500).send({error: err});
                            else {
                                console.log("Successfully Stopped EC2 server instance");
                                console.log(data)
                                resp.sendStatus(200);
                            }
                        });
                    });
                }
            })
        }
    });
}
//startInstances('all');

//API to start instances by id
app.get('/startInstance/:id', function (req, resp) {
    console.log("Sever got a request to start EC2 instance", req.params.id);
    RESOURCE_LOG({
        'instance_id': req.params.id,
        'message': 'Attempting to start EC2 server instance.'
    });
    var instances = [];
    instances.push(req.params.id);
    var paramsOldInstances = {
        InstanceIds: instances,
        DryRun: false
    };
    ec2.startInstances(paramsOldInstances, function (err, data) {
        if (err) {
            RESOURCE_LOG({
                'instance_id': req.params.id,
                'message': 'Failed to start EC2 server instance.'
            });
            console.log(err)
            resp.sendStatus(500);
            return;
        }
        else {
            console.log(data);
            EC2Server.findOneAndUpdate({instanceId: req.params.id}, {$set: {"status": "Running"}}, {upsert: true}, function (err, doc) {
                if (err) return res.status(500).send({error: err});
                console.log("Successfully started EC2 server instance");
                RESOURCE_LOG({
                    'instance_id': req.params.id,
                    'message': 'Successfully started EC2 server instance.'
                });
                // resp.sendStatus(200);
            });
            //resp.json(data);
            resp.sendStatus(200);
        }
    })
})

//API to stop instances by id
app.get('/stopInstance/:id', function (req, resp) {
    console.log('Server got a request to stop Instance')
    RESOURCE_LOG({
        'instance_id': req.params.id,
        'message': 'Attempting to stop EC2 server instance.'
    });
    var instances = [];
    instances.push(req.params.id);
    var paramsForStop = {
        InstanceIds: instances,
        DryRun: false,
        Force: true
    };
    ec2.stopInstances(paramsForStop, function (err, data) {
        if (err) {
            RESOURCE_LOG({
                'instance_id': req.params.id,
                'message': 'Failed to stop EC2 server instance.'
            });
            console.log(err, err.stack);
            resp.sendStatus(500);
            return;
        } // an error occurred
        else {
            EC2Server.findOneAndUpdate({instanceId: req.params.id}, {$set: {"status": "Stopped"}}, {upsert: true}, function (err, doc) {
                if (err) { return res.status(500).send({error: err}); }
                else {
                    RESOURCE_LOG({
                        'instance_id': req.params.id,
                        'message': 'Successfully stopped EC2 server instance.'
                    });
                    console.log("Successfully Stopped EC2 server instance");
                    console.log(data)
                    resp.sendStatus(200);
                }
            });
        }
    });
});

//Setting alarms using aws
var paramsForAlarm = {
    AlarmName: 'CPU_usage', // required
    ComparisonOperator: 'GreaterThanOrEqualToThreshold', // required
    EvaluationPeriods: 1, // required
    MetricName: 'CPUUtilization', // required
    Namespace: 'AWS/EC2', //required
    Period: 60, // required
    Statistic: 'Average', // required
    Threshold: 1.0, // required
    ActionsEnabled: true || false,
    AlarmActions: [
        'arn:aws:swf:us-west-1:{7600-6036-2729}:action/actions/AWS_EC2.InstanceId.Stop/1.0',
        //more items
    ],
    AlarmDescription: 'CPU',
    Dimensions: [
        {
            Name: 'InstanceId', // required
            Value: 'i-0aed5bbf', // required
        },
        //more items
    ],
    Unit: 'Percent'
    // Unit: 'Seconds | Microseconds | Milliseconds | Bytes | Kilobytes | Megabytes | Gigabytes | Terabytes | Bits | Kilobits | Megabits | Gigabits | Terabits | Percent | Count | Bytes/Second | Kilobytes/Second | Megabytes/Second | Gigabytes/Second | Terabytes/Second | Bits/Second | Kilobits/Second | Megabits/Second | Gigabits/Second | Terabits/Second | Count/Second | None'
};
var cloudwatch = new AWS.CloudWatch({region: 'us-west-1'});
cloudwatch.putMetricAlarm(paramsForAlarm, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
});
var paramsStartAlarm = {
    AlarmNames: ['CPU_usage']
};
cloudwatch.enableAlarmActions(paramsStartAlarm, function (err, data) {
    if (err) console.log(err, err.stack);
    else
        console.log("Enabling Alarm")
    console.log(data);
})

//API to get server details
app.get('/servers', function (req, resp) {
    console.log("Server got a request for EC2 Instances allocated");
    EC2Server.find(function (err, data) {
        if (err) return console.error(err)
        console.log(data)
        resp.json(data);
    });
});

var request = new AWS.EC2().describeInstances();
// register a callback to report on the data
request.on('success', function (resp) {
    console.log("Reporting data")
    console.log(resp.data); // log the successful data response
});
request.send();
//getting metrics using cloud watch
var dayInMilliseconds = 1000 * 60 * 60 * 24;
var hourInMilliseconds = 1000 * 60 * 60;
var endTime = new Date();
var startTime = new Date(endTime.getTime() - hourInMilliseconds);
var params = {
    MetricName: "CPUCreditBalance",//"CPUUtilization",
    Namespace: "AWS/EC2",
    Period: 60,
    Statistics: ['SampleCount', 'Average'],
    StartTime: startTime.toISOString(),
    EndTime: endTime.toISOString(),
    Dimensions: [{Name: 'InstanceId', Value: 'i-0aed5bbf'}]
};
//cloud watch API
app.get('/cloudCreditBalance', function (req, resp) {
    console.log("Server got a request for EC2 Credit Balance");
    cloudwatch.getMetricStatistics(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
        resp.json(data);
    });
});

process.stdin.resume();
function changeStatus(newStatus, instanceId) {
    EC2Server.findOneAndUpdate({instanceId: instanceId}, {$set: {"status": newStatus}}, {upsert: true}, function (err, doc) {
        if (err) return res.status(500).send({error: err});
        console.log("Successfully Updated server db" + instanceId + " with status" + newStatus);
        // resp.sendStatus(200);
    });
}
function exitHandler(options, err) {
    if (options.cleanup) {
        console.log('stopping instances');
        //stop all instances
        var instances = [];
        EC2Server.find(function (err, data) {
            if (err) return console.error(err);
            data.forEach(function (record) {
                console.log(record.instanceId);
                instances.push(record.instanceId);
            });
            var paramsForStop = {
                InstanceIds: instances,
                DryRun: false,
                Force: true
            };
            ec2.stopInstances(paramsForStop, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
        });
    }
    if (err) {
        console.log(err.stack)
    }
    if (options.exit) {
        process.exit();
    }
}


var io = require('socket.io-client');
var socket = io.connect('http://localhost:3003', {reconnect: true});
socket.on('connect', function (socket) {
    console.log('Connected to Monitoring Server!');
});

var healthResObj = {};
socket.on('reply', function (data) {
    console.log("The Status of the Sensor is :", data.result.status);
    healthResObj[data.resKey].json(data.result.status); // get the response object from by providing its key
    delete healthResObj[data.resKey];
});

app.get('/check/health', function (req, res) {
    socket.emit('data', 'I need your health status', function ack(data) {
        console.log('data emit was acknowledged by Monitoring Server:', data);
        return res.json(data);
    });
});
// API to get the health of the Sensor by looking up its Status, pass the Sensor ID to check
app.get('/check/health/:id', function (req, res) {
    var id = req.params.id;
    console.log("Server got a health check for Sensor ID :", id);
    var key = Date.now();
    healthResObj[key] = res;
    socket.emit('eventToClient',{ id: id , resKey: key}); // pass the key where the response object stored so that can be retrieved later
})
// send event to monitor server
function SENSOR_LOG(body) {
    socket.emit('sensorLog',{ body: body });
}

// send event to monitor server
function RESOURCE_LOG(body) {
    socket.emit('resourceLog',{ body: body });
}

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

app.listen(3002);
console.log("Server running at  http://localhost:3002/'");