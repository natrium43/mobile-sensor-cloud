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
	var render = {
		title: 'User Dashboard',
		session: sess,
		section: 'sensor-management',
		response: {
			'active_subscriptions': [],
			'terminated_subscriptions': []
		}
	};
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions/active',
		json: true,
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}

		render['response']['active_subscriptions'] = body;
		// to-do: get status from backend

		request.get({
			url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions/terminated',
			json: true,
		}, function(error, response, body) {
			if (error) {
				res.status(400).send();
				return;
			}

			render['response']['terminated_subscriptions'] = body;
			// to-do: get status from backend
			res.render(path.substring(1), {
				render: render
			});
		});
	});
});

router.get('/users/sensor-controller', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	var render = {
		title: 'User Dashboard',
		session: sess,
		section: 'sensor-controller',
		response: {
			'active_subscriptions': []
		}
	};
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions/active',
		json: true,
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}
		render['response']['active_subscriptions'] = body;
		// to-do: get status from backend
		res.render(path.substring(1), {
			render: render
		});
		
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

router.get('/users/provision_sensor', function(req, res, next) {
	var sess = req.session;
	var params = req.params;
	var templatelist = [];
	var templategrouplist = [];
	request.get({
		url: _GLOBAL.config.sensor_db + '/templatelist',
		json: true,
	}, function(error, response, body) {
		if (!error && body) {
			templatelist = body;
		}
		request.get({
			url: _GLOBAL.config.sensor_db + '/templategrouplist',
			json: true,
		}, function(error, response, body) {
			if (!error && body) {
				templategrouplist = body;
			}
			request.get({
				url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant,
				json: true,
			}, function(error, response, body) {
				if (!error && body) {
					// get templates
					var templates = body.templates;
                    templates = templates ? templates.split(",").map(function(v) { return parseInt(v); }) : [];
                    // get group templates
                    var gTemplates = body.group_templates;
                    gTemplates = gTemplates ? gTemplates.split(",").map(function(v) { return parseInt(v); }) : [];
                    
                    var data = {
                    	'templates': [],
                    	'group_templates': []
                    };

                    // filter templatelist
                    for (var i = 0; i < templatelist.length; i++) {
                    	if (templates.indexOf(templatelist[i].templateId) > -1) {
                    		data['templates'].push(templatelist[i]);
                    	}
                    }

                     // filter templategrouplist
                    for (var i = 0; i < templategrouplist.length; i++) {
                    	if (gTemplates.indexOf(templategrouplist[i].templateGroupId) > -1) {
                    		data['group_templates'].push(templategrouplist[i]);
                    	}
                    }
                    console.log(sess);
					res.render('modal/provision_sensor', {
						render: {
							response: data,
							session: sess
						}
					});
					return;
				}
				res.status(500).send();
			});
		});
	});
});

// make POST call to users_id rest api to create subscription
router.post('/subscriptions', function(req, res, next) {
	var payload = req.body;
	request.post({
		url: _GLOBAL.config.user_db + '/subscriptions',
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && response.statusCode === 201) {
			res.status(201).send();
			return;
		}
		res.status(400).send();
	});
});

// make POST call to users_id rest api to create subscription
router.post('/subscriptions/terminate', function(req, res, next) {
	var payload = req.body;
	request.put({
		url: _GLOBAL.config.user_db + '/subscriptions/' + payload.request_id + '/terminate',
		json: true
	}, function(error, response, body) {
		if (!error && response.statusCode === 204) {
			res.status(204).send();
			return;
		}
		res.status(400).send();
	});
});

// control sensor state
// action can be "enable" or "disable"
router.post('/subscriptions/:request_id/:action', function(req, res, next) {
	var params = req.params;
	res.send();
});

module.exports = router;