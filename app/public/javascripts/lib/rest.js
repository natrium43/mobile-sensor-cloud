// REST model
var CONFIG =  {
	'db_server': 'http://127.0.0.1:3001',
};

var REST = {
	STATUS_OK: 200,
	STATUS_CREATED: 201,
	STATUS_NOCONTENT: 204,

	getTenants: function(callback) {
		$.get(CONFIG.db_server + '/tenants', function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(null);
		});
	},

	checkEmailAvailable: function(account, email, tenant, callback) {
		var url = CONFIG.db_server;
		url = (tenant != null ? url + '/tenants/' + tenant : url);
		url += '/' + account + '/' + email;
		$.get(url, function(response, textStatus, jqXHR) {
			// if response is false, it means the email is available
			callback(jqXHR.status === REST.STATUS_OK && !response);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	addUser: function(accountType, data, callback) {
		// create user
		$.post(CONFIG.db_server + "/" + accountType, data, function(response, textStatus, jqXHR) {
			callback(jqXHR.status === REST.STATUS_CREATED);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	addTenant: function(data, callback) {
		// create tenant
		$.post(CONFIG.db_server + '/tenants', data, function(response, textStatus, jqXHR) {
			callback(jqXHR.status === REST.STATUS_CREATED);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	checkTenantAvailable: function(tenant, callback) {
		// check tenant available
		$.get(CONFIG.db_server + '/tenants/' + tenant, function(response, textStatus, jqXHR){
			// if response is false, it means the tenant is available
			callback(jqXHR.status === REST.STATUS_OK  && !response);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	getUser: function(email, tenant, callback) {
		var url = CONFIG.db_server + '/tenants/' + tenant + '/users/' + email;
		$.get(url, function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(null);
		});
	},

	updateUser: function(email, tenant, data, callback) {
		// create tenant
		$.ajax({
		    url: CONFIG.db_server + '/tenants/' + tenant + '/users/' + email,
		    type: 'PUT',
		    data: data,
		    success: function(response, textStatus, jqXHR) {
		    	callback(jqXHR.status === REST.STATUS_NOCONTENT);
		    },
		    error: function (xhr, ajaxOptions, thrownError) {
		        callback(false);
		    }
		});
	},
};
