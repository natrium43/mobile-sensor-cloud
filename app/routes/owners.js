var _GLOBAL = require('../global');
var express = require('express');
var router = express.Router();
var request = require('request'); // handle HTTP requests

// base
router.get('/owners', function(req, res, next) {
	res.redirect('/owners/sensor-management');
});

router.get('/owners/sensor-management', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	request.get({
		url: _GLOBAL.config.sensor_db + '/sensorlist',
		json: true
	}, function(error, response, body) {
		var render = {
			render: {
				title: 'Owner Dashboard',
				session: sess,
				section: 'sensor-management',
				response: []
			}
		}

		if (!error && body) {
			render['render']['response'] = body.sort(sortById);
		}

		res.render(path.substring(1), render);
	});
});

function sortById(a, b) {
	if (a.id < b.id)
		return -1;
	else if (a.id > b.id)
		return 1;
	else
		return 0;
}

module.exports = router;