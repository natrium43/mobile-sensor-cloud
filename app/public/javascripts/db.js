// REST model
var CONFIG =  {
	'user_db': 'http://127.0.0.1:3001'
};

var REST = {
	STATUS_OK: 200,
	STATUS_CREATED: 201,
	STATUS_NOCONTENT: 204
};

var USER_DB = {
	getTenants: function(callback) {
		$.get(CONFIG.user_db + '/tenants', function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(null);
		});
	},

	getTenant: function(tenant, callback) {
		$.get(CONFIG.user_db + '/tenants/' + tenant, function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	checkEmailAvailable: function(account, email, tenant, callback) {
		var url = CONFIG.user_db;
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
		$.post(CONFIG.user_db + "/" + accountType, data, function(response, textStatus, jqXHR) {
			callback(jqXHR.status === REST.STATUS_CREATED);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	addTenant: function(data, callback) {
		// create tenant
		$.post(CONFIG.user_db + '/tenants', data, function(response, textStatus, jqXHR) {
			callback(jqXHR.status === REST.STATUS_CREATED);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	checkTenantAvailable: function(tenant, callback) {
		// check tenant available
		$.get(CONFIG.user_db + '/tenants/' + tenant, function(response, textStatus, jqXHR){
			// if response is false, it means the tenant is available
			callback(jqXHR.status === REST.STATUS_OK  && !response);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(false);
		});
	},

	getUser: function(email, tenant, callback) {
		var url = CONFIG.user_db + '/tenants/' + tenant + '/users/' + email;
		$.get(url, function(response, textStatus, jqXHR){
			callback(jqXHR.status === REST.STATUS_OK ? response : null);
		}).error(function(jqXHR, textStatus, errorThrown) {
			callback(null);
		});
	},

	updateUser: function(email, tenant, data, callback) {
		// create tenant
		$.ajax({
		    url: CONFIG.user_db + '/tenants/' + tenant + '/users/' + email,
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

	updateTemplates: function(tenant, data, callback) {
		// create tenant
		$.ajax({
		    url: CONFIG.user_db + '/tenants/' + tenant + '/templates',
		    type: 'PUT',
		    data: data,
		    success: function(response, textStatus, jqXHR) {
		    	callback(jqXHR.status === REST.STATUS_NOCONTENT);
		    },
		    error: function (xhr, ajaxOptions, thrownError) {
		        callback(false);
		    }
		});
	}
};
