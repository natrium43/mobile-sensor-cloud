var express = require('express');
var router = express.Router();
var winston = require('winston');

var sensor_logger = new (winston.Logger)({transports: []});

router.get('/sensor_logger/:sensor_id', function(req, res, next) {
	var params = req.params;
	var options = {
		from: new Date - 24 * 60 * 60 * 1000,
		until: new Date,
		limit: 10,
		start: 0,
		order: 'desc',
		//fields: ['templateGroupId']
	};

	addTransport(params.sensor_id);
	sensor_logger.query(options, function (err, results) {
		removeTransport()
		if (err) {
			res.status(400).send();
			return;
		}

		res.send(results);
	});
});

router.post('/sensor_logger/:sensor_id', function(req, res, next) {
	var body = req.body;
	var params = req.params;
	addTransport(params.sensor_id);
	sensor_logger.info(body);
	removeTransport();
	res.status(201).send();
});

function addTransport(filename) {
	var transport = _defaultTransport(filename);
	sensor_logger.add(winston.transports.File, transport);
}

function removeTransport() {
	sensor_logger.remove(winston.transports.File);
}

function _defaultTransport(filename) {
	return {
		filename: './log/' + filename + '.log',
		level: 'info',
	    json: true,
	    timestamp: true
	};
}

module.exports = router;