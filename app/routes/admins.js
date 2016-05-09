var _GLOBAL = require('../global');
var express = require('express');
var router = express.Router();
var request = require('request'); // handle HTTP requests

// base
router.get('/admins', function(req, res, next) {
	res.redirect('/admins/tenants');
});

router.get('/admins/tenants', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	request.get({
		url: _GLOBAL.config.user_db + '/tenants?verbose=true',
		json: true
	}, function(error, response, body) {
		var render = {
			render: {
				title: 'Admin Dashboard',
				session: sess,
				section: 'tenants',
				response: []
			}
		}

		if (!error && body) {
			render['render']['response'] = body;
		}

		res.render(path.substring(1), render);
	});
});

router.get('/admins/templates', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	request.get({
		url: _GLOBAL.config.sensor_db + '/templatelist',
		json: true
	}, function(error, response, body) {
		var render = {
			render: {
				title: 'Admin Dashboard',
				session: sess,
				section: 'templates',
				response: {
					template: [],
					templategroup: []
				}
			}
		}

		if (!error && body) {
			render['render']['response']['template'] = body.sort(sortByTemplateId);
		}
		request.get({
			url: _GLOBAL.config.sensor_db + '/templategrouplist',
			json: true
		}, function(error, response, body) {
			if (!error && body) {
				render['render']['response']['templategroup'] = body.sort(sortByTemplateGroupId);
			}
			res.render(path.substring(1), render);
		});
	});
});

router.get('/admins/sensor-monitor', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	var render = {
		render: {
			title: 'Admin Dashboard',
			session: sess,
			section: 'sensor-monitor',
			response: []
		}
	};
	request.get({
		url: _GLOBAL.config.sensor_db + '/sensorlist',
		json: true
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}

		var sensors = body.sort(sortBySensorId);
		var length = sensors.length;
		if (length > 0) {
			for (var i = 0; i < sensors.length; i++) {
				(function(index) {
					request.get({
						url: _GLOBAL.config.monitor + '/monitor/sensors/' + sensors[index].id,
						json: true
					}, function(error, response, body) {
						if (!error && body) {
							sensors[index]['log'] = body;
						}
						if ((index + 1) === length) {
							render['render']['response'] = sensors;
							console.log(JSON.stringify(render.render.response));
							res.render(path.substring(1), render);
						}
					});
				})(i);
			}
		} else {
			res.render(path.substring(1), render);
		}
	});
});

router.get('/admins/resources', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'Admin Dashboard',
			session: sess,
			section: 'resources'
		}
	});
});

function sortByTemplateId(a, b) {
	if (a.templateId < b.templateId)
		return -1;
	else if (a.templateId > b.templateId)
		return 1;
	else
		return 0;
}

function sortByTemplateGroupId(a, b) {
	if (a.templateGroupId < b.templateGroupId)
		return -1;
	else if (a.templateGroupId > b.templateGroupId)
		return 1;
	else
		return 0;
}

function sortBySensorId(a, b) {
	if (a.id < b.id)
		return -1;
	else if (a.id > b.id)
		return 1;
	else
		return 0;
}

module.exports = router;