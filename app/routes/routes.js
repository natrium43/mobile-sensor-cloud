var _GLOBAL = require('../global');
var express = require('express');
var router = express.Router();
var request = require('request'); // handle HTTP requests

// Default route
router.get('/', function(req, res, next) {
 	res.redirect('/login');
});

router.get('/logout', function(req, res, next) {
	// clear session
	req.session.destroy();
	res.redirect('/login');
});

router.get('/login', function(req, res, next) {
	var sess = req.session;
	// check if session exists
	// navigate to dashboard if user is already logged in
	if (sess.account && sess.email) {
		res.redirect('/' + sess.account);
		return;
	}

	// clear session
	sess.destroy();
	res.render('login', {
		render: {
			title: 'Login',
			page: 'login',
			alert: (sess.login_error ? sess.login_error : null)
		}
	});
});

// authenticate user
// on success: redirect to dashboard
// on fail: reload login and show error message
router.post('/login/authenticate', function(req, res, next) {	
	var postData = req.body;
	var sess = req.session;
	request.post({
		url: _GLOBAL.config.user_db + '/authenticate',
		json: true,
		body: postData
	}, function(error, response, body) {
		if (!error && body) {
			// set session variables
			sess.account = postData.account;
			sess.email = body.email
			if (postData.account === 'owners') {
				sess.id = body.owner_id;
			}
			if (postData.account === 'users') {
				sess.tenant = postData.tenant;
				sess.tenant_id = body.tenant_id;
				sess.id = body.user_id;
				sess.address = body.address;
			}
			
			res.redirect('/' + postData.account);
			return;
		}

    	if (postData.account === 'users') {
    		sess.login_error = 'Username, password and/or tenant is invalid.';
    	} else {
    		sess.login_error = 'Username and/or password is invalid.';
    	}
    	res.redirect('/login');
	});
});

router.get('/modal/:view', function(req, res, next) {
	var query = req.query;
	var payload = req.body;
	var view = 'modal/' + req.params.view;
	res.render(view, {
		render: {
			query: query
		}
	});
});

router.get('/modal/manage_tenant/:tenant', function(req, res, next) {
	var params = req.params;
	var data = {};
	request.get({
		url: _GLOBAL.config.sensor_db + '/templatelist',
		json: true,
	}, function(error, response, body) {
		if (!error && body) {
			data['templates'] = body;
		}
		request.get({
			url: _GLOBAL.config.sensor_db + '/templategrouplist',
			json: true,
		}, function(error, response, body) {
			if (!error && body) {
				data['group_templates'] = body;
			}
			request.get({
				url: _GLOBAL.config.user_db + '/tenants/' + params.tenant,
				json: true,
			}, function(error, response, body) {
				if (!error && body) {
					// get templates
					var templates = body.templates;
                    templates = templates ? templates.split(",").map(function(v) { return parseInt(v); }) : [];
                    // get group templates
                    var gTemplates = body.group_templates;
                    gTemplates = gTemplates ? gTemplates.split(",").map(function(v) { return parseInt(v); }) : [];
                    data['tenant'] = body;
                    data['tenant']['templates'] = templates;
                    data['tenant']['group_templates'] = gTemplates;
				}
				request.get({
					url: _GLOBAL.config.user_db + '/tenants/' + params.tenant + '/users',
					json: true,
				}, function(error, response, body) {
					if (!error && body) {
	                    // get tenant users
	                    data['tenant']['users'] = body;
						res.render('modal/manage_tenant', {
							render: {
								response: data
							}
						});
						return;
					}
					res.status(500).send();
				});
			});
		});
	});
});

router.get('/modal/sensor_template/:template_id', function(req, res, next) {
	var params = req.params;
	request.get({
		url: _GLOBAL.config.sensor_db + '/templatelist/' + params.template_id,
		json: true,
	}, function(error, response, body) {
		if (!error && body) {
			res.render('modal/sensor_template', {
				render: {
					edit: true,
					response: body
				}
			});
			return;
		}
		res.status(500).send();
	});
});

// make DELETE call to sensor_db rest api
// category: sensorList, templatelist, templategrouplist
router.post('/delete/:category/:id', function(req, res, next) {
	var params = req.params;
	var url = _GLOBAL.config.sensor_db + '/' + params.category + '/' + params.id;
	request.del(url, function(error, response, body) {
		if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
			res.status(204).send();
			return;
		}
		res.status(400).send();
	});
});

// make POST call to sensor_db rest api
router.post('/add/:category', function(req, res, next) {
	var params = req.params;
	var payload = req.body;
	request.post({
		url: _GLOBAL.config.sensor_db + '/' + params.category,
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
			res.status(201).send();
			return;
		}
		res.status(400).send();
	});
});

// make PUT call to sensor_db rest api
router.post('/update/:category/:id', function(req, res, next) {
	var params = req.params;
	var payload = req.body;
	request.put({
		url: _GLOBAL.config.sensor_db + '/' + params.category + '/' + params.id,
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && (response.statusCode === 200 || response.statusCode === 204)) {
			res.status(204).send();
			return;
		}
		res.status(400).send();
	});
});

// get all tenants
router.get('/db/tenants', function(req, res, next) {
	request.get({
		url: _GLOBAL.config.user_db + '/tenants',
		json: true,
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send(body);
			return;
		}
		res.status(400).send(null);
	});
});

// get specific tenant
router.get('/db/tenants/:tenant', function(req, res, next) {
	var params = req.params;
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + params.tenant,
		json: true,
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send(body);
			return;
		}
		res.status(400).send(null);
	});
});

// check if email is available
router.get('/db/checkemailavailable', function(req, res, next) {
	var query = req.query;
	//var url = _GLOBAL.config.user_db;
	//url = (query.tenant == undefined ? url : url + '/tenants/' + query.tenant);
	//url += '/' + query.account + '/' + query.email;
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + query.tenant + '/users/' + query.email,
		json: true,
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send(!body);
			return;
		}
		res.status(400).send(false);
	});
});

// add a user
router.post('/db/users', function(req, res, next) {
	var payload = req.body;
	request.post({
		url: _GLOBAL.config.user_db + '/users',
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

// add a tenant
router.post('/db/tenants', function(req, res, next) {
	var payload = req.body;
	request.post({
		url: _GLOBAL.config.user_db + '/tenants',
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

// check if tenant is available
router.get('/db/checktenantavailable', function(req, res, next) {
	var query = req.query;
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + query.tenant,
		json: true,
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send(!body);
			return;
		}
		res.status(400).send(false);
	});
});

// get a user
router.get('/db/tenants/:tenant/users/:email', function(req, res, next) {
	var params = req.params;
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + params.tenant + '/users/' + params.email,
		json: true,
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			res.send(body);
			return;
		}
		res.status(400).send(null);
	});
});

// update tenant user
router.post('/db/tenants/:tenant/users/:email', function(req, res, next) {
	var params = req.params;
	var payload = req.body;
	request.put({
		url: _GLOBAL.config.user_db + '/tenants/' + params.tenant + '/users/' + params.email,
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && response.statusCode === 204) {
			res.status(204).send();
			return;
		}
		res.status(400).send(false);
	});
});

// update tenant templates
router.post('/db/tenants/:tenant/templates', function(req, res, next) {
	var params = req.params;
	var payload = req.body;
	request.put({
		url: _GLOBAL.config.user_db + '/tenants/' + params.tenant + '/templates',
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && response.statusCode === 204) {
			res.status(204).send();
			return;
		}
		res.status(400).send(false);
	});
});

module.exports = router;

// session variables:
// => account
// => email
// => id (references user_id/owner_id)
// => tenant (name -- for users only)
// => tenant_id (id -- for users only)
// => address (for users only)