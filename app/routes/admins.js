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

	// get tenant info
	request.get({
		url: _GLOBAL.config.db_server + '/tenants?verbose=true',
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
	res.render(path.substring(1), {
		render: {
			title: 'Admin Dashboard',
			session: sess,
			section: 'templates'
		}
	});
});

router.get('/admins/sensor-monitor', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'Admin Dashboard',
			session: sess,
			section: 'sensor-monitor'
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

module.exports = router;