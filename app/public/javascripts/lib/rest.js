// REST model
var CONFIG =  {
	'db_server': 'http://127.0.0.1:3001',
};

var REST = {
	STATUS_OK: 200,
	STATUS_CREATED: 201,
	STATUS_NOCONTENT: 204,

	getTenants: function(callback) {
		$.get(CONFIG.db_server + "/tenants", function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		});
	},

	checkEmailAvailable: function(account, email, tenant, callback) {
		var url = CONFIG.db_server;
		url = (tenant != null ? url + '/tenants/' + tenant : url);
		url += '/' + account + '/' + email;
		$.get(url, function(response, textStatus, jqXHR) {
			// if response is false, it means the email is available
			callback(jqXHR.status === REST.STATUS_OK && !response);
		});
	},

	addUser: function(accountType, data, callback) {
		// create user
		$.post(CONFIG.db_server + "/" + accountType, data, function(response, textStatus, jqXHR) {
			callback(jqXHR.status === REST.STATUS_CREATED);
		});
	}
};
