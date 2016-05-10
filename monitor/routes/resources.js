var express = require('express');
//var router = express.Router();
var winston = require('winston');

var resources_logger = new winston.Logger({
  transports: [
    new (winston.transports.File)({
    	filename: './log/resources.log',
		level: 'info',
	    json: true,
	    timestamp: true
 	}),
  ]
});


var EVENT = {
	getAllEvents: function(callback) {
		var endDate = new Date();
		var startDate = new Date();
		startDate.setDate(startDate.getDate() - 7);
		var options = {
			from: startDate,
			until: endDate,
			limit: 50,
			start: 0,
			order: 'desc',
			fields: ['message', 'data', 'timestamp']
		};

		resources_logger.query(options, function (err, results) {
			if (err) {
				console.log(err);
				callback(null);
				return;
			}
			results = results.file;
			callback(results);
		});
	},
	newEvent: function(body, callback) {
		// get message
		var msg = body.message;
		delete body['message'];
		resources_logger.info(msg, {'data': body});
		callback(true)
	}
};

module.exports = EVENT;