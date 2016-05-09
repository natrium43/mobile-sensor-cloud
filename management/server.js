var express = require('express');
var http = require('http').Server(app); // http server
var bodyParser = require("body-parser");
var cors = require('cors');
var winston = require('winston');
var mysql = require('mysql');
var bcrypt = require('bcrypt');  // use for encryption

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// logger
winston.add(winston.transports.File, {
    filename: './log/access.log',
    level: 'info',
    json: false,
    timestamp: true
});
// winston.remove(winston.transports.Console);

// http://bcrypthashgenerator.apphb.com
// default admin account
var SYSADMIN = {
	'account': 'admins',
	'email': 'admin@sjsu.edu',
	'password': '$2a$10$LJsjVTbZYHt6HGMX8eD8XewxEtRAyMS.2Y7NKifi/CyZh/4lAqsYK' // welcome1
};

// NOTE: need to set the db host and add api user to db
var connection = mysql.createConnection({
	multipleStatements: true,
    host : 'localhost',
    user : 'root',
    password : 'welcome1',
    database : 'user_management',
});

// tenant
app.get('/tenants', function(req, res) {
	var params = req.query;
	var query = "SELECT * FROM tenants ORDER BY name";
	// check if verbose params is set to true
	if (params.verbose !== undefined && params.verbose == 'true') {
		query = "SELECT tenants.templates AS templates, tenants.group_templates AS group_templates, tenants.tenant_id, tenants.name AS tenant, count(DISTINCT users.user_id) AS users, count(DISTINCT request_id) AS subscriptions " +
				"FROM tenants " +
				"LEFT JOIN users ON tenants.tenant_id=users.tenant_id " +
				"LEFT JOIN subscriptions ON tenants.tenant_id=subscriptions.tenant_id " +
				"GROUP BY tenants.tenant_id";
	}
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows));
		res.send(rows);
	});
});

app.get('/tenants/:tenant', function(req, res) {
	var params = req.params;
	var query = "SELECT * FROM tenants WHERE name=" + _str(params.tenant);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows[0]));
		res.send(rows[0]);
	});
});

app.post('/tenants', function(req, res) {
	var payload = req.body;
	var query = "INSERT INTO tenants (name) VALUES (" + _str(payload.name) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
 			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'created tenant name ' + payload.name);
		res.status(201).send();
	});
});

// users
app.get('/tenants/:tenant/users', function(req, res) {
	var params = req.params;
	var query = "SELECT * FROM users WHERE tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + _str(params.tenant) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows));
		res.send(rows);
	});
});

app.get('/tenants/:tenant/users/:email', function(req, res) {
	var params = req.params;
	var query = "SELECT * FROM users WHERE email=" + _str(params.email) + 
				" AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + _str(params.tenant) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows[0]));
		res.send(rows[0]);
	});
});

app.post('/users', function(req, res) {
	var payload = req.body;
	// encrypt password
	payload.password = bcrypt.hashSync(payload.password, 10);
	var query = "INSERT INTO users (email, password, tenant_id, name, address) VALUES " +
				"(" + _str(payload.email) + "," + _str(payload.password) + "," + payload.tenant +
				"," + _str(payload.name) + "," + _str(payload.address) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'created user ' + payload.email);
		res.status(201).send();
	});
});

app.put('/tenants/:tenant/users/:email', function(req, res) {
	var params = req.params;
	var payload = req.body;
	// remove properties that can't be updated
	delete payload['email'];
	delete payload['tenant'];
	// build query
	var query = "UPDATE users SET ";
	for (var prop in payload) {
		query += prop + "=" + _str(payload[prop]) + ",";
	}
	// remove last comma
	query = query.substring(0, query.length - 1);
	query += " WHERE email=" + _str(params.email) + 
			" AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + _str(params.tenant) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'updated user ' + params.email);
		res.status(204).send();
	});
});

// owners
app.get('/owners/:email', function(req, res) {
	var params = req.params;
	var query = "SELECT * FROM owners WHERE email=" + _str(params.email);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows[0]));
		res.send(rows[0]);
	});
});

app.put('/owners/:email', function(req, res) {
	var params = req.params;
	var payload = req.body;
	// remove properties that can't be updated
	delete payload['email'];
	// build query
	var query = "UPDATE owners SET ";
	for (var prop in payload) {
		query += prop + "=" + _str(payload[prop]) + ",";
	}
	// remove last comma
	query = query.substring(0, query.length - 1);
	query += " WHERE email=" + _str(params.email);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'updated owner ' + params.email);
		res.status(204).send();
	});
});

app.post('/owners', function(req, res) {
	var payload = req.body;
	// encrypt password
	payload.password = bcrypt.hashSync(payload.password, 10);
	var query = "INSERT INTO owners (email, password, name) VALUES " +
				"(" + _str(payload.email) + "," + _str(payload.password) + "," +
				_str(payload.name) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'created owner ' + payload.email);
		res.status(201).send();
	});
});

app.put('/tenants/:tenant/templates', function(req, res) {
	var params = req.params;
	var payload = req.body;
	// build query
	var query = "UPDATE tenants SET templates=" + _str(payload.templates) + ",group_templates=" + _str(payload.group_templates);
	query += " WHERE tenant_id=(SELECT tenant_id FROM (SELECT * FROM tenants) AS temp WHERE temp.name=" + _str(params.tenant) + ")";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, 'updated templates for tenant ' + params.tenant);
		res.status(204).send();
	});
});

//login
app.post('/authenticate', function(req, res) {
	var payload = req.body;

	// if system admin, use SYSADMIN object to authenticate
	if (payload.account === 'admins') {
		if (bcrypt.compareSync(payload.password, SYSADMIN.password)) {
			_ACCESS_LOG.success(req.method, req.url, JSON.stringify(SYSADMIN));
			res.send(SYSADMIN);
		} else {
			_ACCESS_LOG.success(req.method, req.url, 'false');
			res.send(false);
		}
		return;
	}

	var query = "SELECT * FROM " + payload.account + " WHERE email=" + _str(payload.email);
	if (payload.account === 'users') {
		query += " AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + _str(payload.tenant) + ")";
	}
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}

		if (rows && rows.length > 0) {
			// compare raw password with hashed password
 			if (bcrypt.compareSync(payload.password, rows[0].password)) {
 				_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows[0]));
 				res.send(rows[0]);
 			} else {
 				_ACCESS_LOG.success(req.method, req.url, 'false');
 				res.send(false);
 			}
 			return;
		}

		_ACCESS_LOG.warning(req.method, req.url, 'authentication failed login does not exist.');
		res.status(400).send();
	});
});

// create new subscription
app.post('/subscriptions', function(req, res) {
	var payload = req.body;
	var templateType = payload.template_type;
	var query = "INSERT INTO subscriptions (user_id, template_id, tenant_id) VALUES " +
				"(" + parseInt(payload.user_id) + "," + parseInt(templateType === 'templateId' ? payload.templateId : payload.templateGroupId) + "," +
				parseInt(payload.tenant_id) + "); SELECT LAST_INSERT_ID() AS request_id;";
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}

		if (templateType === 'templateId') {
			// use backend to provision
		} else if (templateType === 'templateGroupId') {
			// use backend to provision
		}

		// if provision was successful, send back request_id successful
		// else update database with subscription terminated


		_ACCESS_LOG.success(req.method, req.url, 'created subscription for ' + payload.email);
		res.status(201).send(rows[0]);
	});
});

// terminate subscription
app.put('/subscriptions/:request_id/terminate', function(req, res) {
	var params = req.params;

	// perform terminate sensor using backend API
	// on success, update subscription table

	// build query
	var query = "UPDATE subscriptions SET status='terminated', destroyed=current_timestamp WHERE request_id=" + parseInt(params.request_id);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}

		_ACCESS_LOG.success(req.method, req.url, 'updated subscription status to terminated for ' + params.request_id);
		res.status(204).send();
	});
});

// get active subscriptions
app.get('/tenants/:tenant/users/:email/subscriptions/active', function(req, res) {
	var params = req.params;
	var query = "SELECT users.email, tenants.name AS tenant_name, request_id, template_id, subscriptions.created " +
				"FROM subscriptions LEFT JOIN users ON subscriptions.user_id=users.user_id " +
				"LEFT JOIN tenants ON subscriptions.tenant_id=tenants.tenant_id " +
				"WHERE subscriptions.status='active' AND users.email=" + _str(params.email) + " AND tenants.name=" + _str(params.tenant);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows));
		res.send(rows);
	});
});

// get terminated subscriptions
app.get('/tenants/:tenant/users/:email/subscriptions/terminated', function(req, res) {
	var params = req.params;
	var query = "SELECT users.email, tenants.name AS tenant_name, request_id, template_id, subscriptions.created, subscriptions.destroyed " +
				"FROM subscriptions LEFT JOIN users ON subscriptions.user_id=users.user_id " +
				"LEFT JOIN tenants ON subscriptions.tenant_id=tenants.tenant_id " +
				"WHERE subscriptions.status='terminated' AND users.email=" + _str(params.email) + " AND tenants.name=" + _str(params.tenant);
	connection.query(query, function(err, rows) {
		if (err) {
			_ACCESS_LOG.error(req.method, req.url, err);
			res.status(400).send();
			return;
		}
		_ACCESS_LOG.success(req.method, req.url, JSON.stringify(rows));
		res.send(rows);
	});
});

app.listen(3001, function () {
  console.log('USER_DB listening on port 3001!');
});

// HELPER FUNCTIONS

// add quotes to string
function _str(val) {
	return "'" + val + "'";
}

// method { POST, PUT, GET, DELETE }
// type { SUCCESS, ERROR, WARNING }
var _ACCESS_LOG = {
	_log: function(method, url, type, msg) {
		var log = method + ' ' + url + ' - ' + type;
		if (msg) {
			log += ': ' + msg;
		}
		winston.info(log);
	},
	error: function(method, url, msg) {
		this._log(method, url, 'ERROR', msg);
	},
	success: function(method, url, msg) {
		this._log(method, url, 'SUCCESS', msg);
	},
	warning: function(method, url, msg) {
		this._log(method, url, 'WARNING', msg);
	}
};

// REST API
/*
GET  /tenants 							- returns all tenant info
GET  /tenants?verbose=true 				- returns all tenant info with user and subscription counts (verbose is false by default)
GET  /tenants/:tenant/users 			- return all user info for tenant
GET  /tenants/:tenant/users/:email 		- return user info
GET  /owners/:email 					- get owner info
POST /tenants 							- create new tenant
POST /users 							- create new user
POST /owners 							- create new owner
POST /authenticate 						- authenticate user credentials
PUT  /tenants/:tenant/users/:email 		- update user info
PUT  /tenants/:tenant/templates         - update available templates and group_tempaltes for tenant
PUT  /owners/:email 					- update owner info
POST /subscriptions						- create subscription
PUT  /subscriptions/:request_id/terminate	- terminate subscription
GET  /tenants/:tenant/users/:email/subscriptions/active - get all active subscriptions for tenant user
GET  /tenants/:tenant/users/:email/subscriptions/terminated - get all terminated subscriptions for tenant user
*/