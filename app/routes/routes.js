// Variables are passed to Views using the 2nd param for res.render()
// In Views, we can access the variables using "response.{variable_name}"
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

router.get('/modal/:view', function(req, res, next) {
	var query = req.query;
	var view = 'modal/' + req.params.view;
	res.render(view, {
		render: {
			query: query
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
		url: _GLOBAL.config.db_server + '/authenticate',
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

module.exports = router;

// session variables:
// => account
// => email
// => id (references user_id/owner_id)
// => tenant (name -- for users only)
// => tenant_id (id -- for users only)
// => address (for users only)