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
	res.render(path.substring(1), {
		render: {
			title: 'Owner Dashboard',
			session: sess,
			section: 'sensor-management'
		}
	});
});

module.exports = router;