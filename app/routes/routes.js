// Variables are passed to Views using the 2nd param for res.render()
// In Views, we can access the variables using "response.{variable_name}"

var express = require('express');
var router = express.Router();

// Default route
router.get('/', function(req, res, next) {
 	res.redirect('/login');
});

router.get('/logout', function(req, res, next) {
	// TODO: implement logout
	res.redirect('/login');
});

router.get('/login', function(req, res, next) {
	// TODO: implement session login
	
	res.render('login', {
		response: {
			title: 'Login',
			page: 'login'
		}
	});
});

router.post('/login/authenticate', function(req, res, next) {	
	var data = req.body;
	var sess = req.session;

	// TODO: implement login
	var success = true;

	if (success) {
		// set session variables
		sess.username = data.username
		sess.account = data.account;
		//sess.tenant = data.tenant;
		res.redirect('/dashboard');
	} else {
		//sess.login_error = 'Username and/or password is invalid.';
		res.redirect('/login');
	}
});

router.get('/dashboard', function(req, res, next) {
	var sess = req.session;
	res.render('dashboard', {
		response: {
			title: 'Dashboard',
			page: 'dashboard',
			username: sess.username,
			account: sess.account
		}
	});
});

/*
router.get('/services', function(req, res, next) {
	var sess = req.session;
	res.render('services', {
		response: {
			title: 'Service Catalog',
			page: 'services',
			username: sess.username,
			account: sess.account
		}
	});
});
*/

router.get('/modal/:view', function(req, res, next) {
	var view = 'modal/' + req.params.view;
	res.render(view, {});
});

module.exports = router;
