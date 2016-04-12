var logger = require('./custom_logger');
var mysql = require('mysql');
var bcrypt = require('bcrypt');  // use for encryption

// NOTE: need to set the db host and add api user to db
var connection = mysql.createConnection({
	multipleStatements: true,
    host : '10.0.0.6', //'172.31.208.23', //'10.0.0.6',
    user : 'api',
    password : 'root',
    database : 'user_management',
});

// owners: (email, password, name)
// users: (email, password, tenant_id, name, address)

var db = {
	// execute query and log results
	_execute: function(query, payload, req, callback) {
		logger.DEBUG(req.method, req.originalUrl, payload);
		logger.INFO("QUERY: " + query);
		connection.query(query, function(err, rows) {
			if (err) {
				logger.ERROR(err);
				callback(false);
				return;
			}

			logger.INFO("RESPONSE: " + JSON.stringify(rows));
			callback(rows);
		});
	},

	// add single quotes to val for query purposes
	_str: function(val) {
		return "'" + val + "'";
	},

	// add new tenant
	addTenant: function(req, res) {
		var payload = req.body;
		var query = "INSERT INTO tenants (name) VALUES (" + this._str(payload.name) + ")";
		this._execute(query, payload, req, function(response){
			if (response) {
	 			res.status(201).send();
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// add owner
	addOwner: function(req, res) {
		var payload = req.body;
		// encrypt password
		payload.password = bcrypt.hashSync(payload.password, 10);
		var query = "INSERT INTO owners (email, password, name) VALUES " +
					"(" + this._str(payload.email) + "," + this._str(payload.password) + "," +
					this._str(payload.name) + ")";
		this._execute(query, payload, req, function(response){
	 		if (response) {
	 			res.status(201).send();
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// add tenant user
	addUser: function(req, res) {
		var payload = req.body;
		// encrypt password
		payload.password = bcrypt.hashSync(payload.password, 10);
		var query = "INSERT INTO users (email, password, tenant_id, name, address) VALUES " +
					"(" + this._str(payload.email) + "," + this._str(payload.password) + "," + payload.tenant +
					"," + this._str(payload.name) + "," + this._str(payload.address) + ")";
		this._execute(query, payload, req, function(response){
	 		if (response) {
	 			res.status(201).send();
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// update tenant user
	updateUser: function(req, res) {
		var params = req.params;
		var payload = req.body;
		// remove properties that can't be updated
		delete payload['email'];
		delete payload['tenant'];
		// build query
		var query = "UPDATE " + params.account + " SET ";
		for (var prop in payload) {
			query += prop + "=" + this._str(payload[prop]) + ",";
		}
		// remove last comma
		query = query.substring(0, query.length - 1);
		query += " WHERE email=" + this._str(params.email) + 
				" AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + this._str(params.tenant) + ")";
		this._execute(query, payload, req, function(response){
	 		if (response) {
	 			res.status(204).send();
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// update owner
	updateOwner: function(req, res) {
		var params = req.params;
		var payload = req.body;
		// remove properties that can't be updated
		delete payload['email'];
		// build query
		var query = "UPDATE owners SET ";
		for (var prop in payload) {
			query += prop + "=" + this._str(payload[prop]) + ",";
		}
		// remove last comma
		query = query.substring(0, query.length - 1);
		query += " WHERE email=" + this._str(params.email);
		this._execute(query, payload, req, function(response){
	 		if (response) {
	 			res.status(204).send();
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// get owner info
	getOwner: function(req, res) {
		var params = req.params;
		var query = "SELECT * FROM owners WHERE email=" + this._str(params.email);
		this._execute(query, null, req, function(response){
	 		if (response) {
	 			res.send(response[0]);
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// get user info
	getUser: function(req, res) {
		var params = req.params;
		var query = "SELECT * FROM users WHERE email=" + this._str(params.email) + 
					" AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + this._str(params.tenant) + ")";
		this._execute(query, null, req, function(response){
	 		if (response) {
	 			res.send(response[0]);
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// get all user info
	getUsers: function(req, res) {
		var params = req.params;
		var query = "SELECT * FROM users WHERE tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + this._str(params.tenant) + ")";
		this._execute(query, null, req, function(response){
	 		if (response) {
	 			res.send(response);
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// return all tenant names
	getTenants: function(req, res) {
		var query = "SELECT * FROM tenants ORDER BY name";
		this._execute(query, null, req, function(response){
			if (response) {
	 			res.send(response);
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// return all tenant
	getTenant: function(req, res) {
		var params = req.params;
		var query = "SELECT * FROM tenants WHERE name=" + this._str(params.tenant);
		this._execute(query, null, req, function(response){
			if (response) {
	 			res.send(response[0]);
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	},

	// authenticate user
	authenticate: function(req, res) {
		var payload = req.body;
		var query = "SELECT * FROM " + payload.account + " WHERE email=" + this._str(payload.email);
		if (payload.account === 'users') {
			query += " AND tenant_id=(SELECT tenant_id FROM tenants WHERE name=" + this._str(payload.tenant) + ")";
		}
		this._execute(query, payload, req, function(response){
	 		if (response && response.length > 0) {
	 			// compare raw password with hashed password
	 			if (bcrypt.compareSync(payload.password, response[0].password)) {
	 				res.send(response[0]);
	 			} else {
	 				res.send(false);
	 			}
	 			return;
	 		}
	 		res.status(400).send();
	 	});
	}
};

module.exports = db;