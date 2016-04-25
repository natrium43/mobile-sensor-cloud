var _GLOBAL = require('../global');
var express = require('express');
var router = express.Router();
var request = require('request'); // handle HTTP requests

// base
router.get('/users', function(req, res, next) {
	res.redirect('/users/sensor-management');
});

router.get('/users/sensor-management', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'sensor-management'
		}
	});
});

router.get('/users/sensor-controller', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'sensor-controller'
		}
	});
});

router.get('/users/sensor-monitor', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'sensor-monitor'
		}
	});
});

router.get('/users/cost-management', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'cost-management'
		}
	});
});

router.get('/users/account', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'account'
		}
	});
});

module.exports = router;