var express = require('express');
//var router = express.Router();
var winston = require('winston');

winston.add(winston.transports.File, {
	filename: './log/sensors.log',
	level: 'info',
    json: true,
    timestamp: true
});

var EVENT = {
	getEvents: function(sensorId, callback) {
		var options = {
			//from: new Date - 24 * 60 * 60 * 1000,
			//until: new Date,
			limit: 50,
			start: 0,
			order: 'desc',
			fields: ['message', 'data', 'timestamp']
		};

		winston.query(options, function (err, results) {
			if (err) {
				console.log(err);
				callback(null);
				return;
			}
			results = results.file;

			var response = [];
			for (var i = 0; i < results.length; i++) {
				if (parseInt(results[i].data.sensor_id) === parseInt(sensorId)) {
					response.push(results[i]);
				}
			}

			callback(response);
		});
	},
	getAllEvents: function(callback) {
		var options = {
			//from: new Date - 24 * 60 * 60 * 1000,
			//until: new Date,
			//limit: 10,
			start: 0,
			order: 'desc',
			fields: ['message', 'data', 'timestamp']
		};

		winston.query(options, function (err, results) {
			if (err) {
				console.log(err);
				callback(null);
				return;
			}
			results = results.file;

			var response = {};
			for (var i = 0; i < results.length; i++) {
				var r = results[i];
				if (response.hasOwnProperty(r.data.sensor_id)) {
					response[r.data.sensor_id].push(r);
				} else {
					response[r.data.sensor_id] = [];
					response[r.data.sensor_id].push(r);
				}
			}
			callback(response);
		});
	},
	newEvent: function(body, callback) {
		// get message
		var msg = body.message;
		delete body['message'];
		winston.info(msg, {'data': body});
		callback(true)
	}
};

module.exports = EVENT;