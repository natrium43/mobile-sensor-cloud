$(function() {
	$('#create-tenant').on('click', function() {
		$('#modal').load('/modal/create_tenant', function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('.manage-tenant').on('click', function() {
		var id = $(this).data('tenant-id');
		var name = $(this).data('tenant');
		$('#modal').load('/modal/manage_tenant?tenant_id=' + id + "&tenant=" + name, function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('#register-sensor').on('click', function() {
		$('#modal').load('/modal/register_sensor', function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('#create-sensor-template, #create-sensor-group-template').on('click', function() {
		var templateType = $(this).data('template');
		var view = (templateType === 'sensor-group' ? '/sensor_group_template' : '/sensor_template');
		view += '?edit=false';
		$('#modal').load('/modal' + view, function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('.delete-sensor-template, .delete-sensor-group-template').on('click', function() {
		var r = confirm('Are you sure you want to delete this template?');
		if (r) {
			window.location.reload();
		}
	});

	$('.edit-sensor-template, .edit-sensor-group-template').on('click', function() {
		var templateType = $(this).data('template');
		var view = (templateType === 'sensor-group' ? '/sensor_group_template' : '/sensor_template');
		view += '?id=&edit=true';
		$('#modal').load('/modal' + view, function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	// sensor owner
	$('.delete-owner-sensor').on('click', function() {
		var r = confirm('Are you sure you want to delete this sensor?');
		if (r) {
			window.location.reload();
		}
	});

	// sensor user
	$('#new-sensor-request').on('click', function() {
		$('#modal').load('/modal/provision_sensor', function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('#my-account').on('click', function() {
		var email = $(this).data('email');
		var tenant = $(this).data('tenant');
		$('#modal').load('/modal/account', function() {
			REST.getUser(email, tenant, function(data) {
				var form = $('#my-account-form');
				form.find('input[name="name"]').val(data.name);
				form.find('textarea[name="address"]').val(data.address);
				form.find('input[name="email"]').val(data.email);
				form.find('input[name="account"]').val('Sensor User');
				form.find('input[name="tenant"]').val(tenant);
				$('#modal').modal('show');
			});
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('.edit-collection').on('click', function() {
		var requestId = $(this).data('requestid');
		var frequency = $(this).data('frequency');
		$('#modal').load('/modal/edit_collection?requestid=' + requestId + '&frequency=' + frequency, function() {
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});

	$('.delete-user-sensor').on('click', function() {
		var r = confirm('Are you sure you want to terminate this sensor?');
		if (r) {
			window.location.reload();
		}
	});
});