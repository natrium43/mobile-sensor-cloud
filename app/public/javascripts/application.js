// Layout
$(function() {
	// this is a global modal used throughout the application
	// To load a view into the modal, use jquery.load('/modal/view_name', function(){ DO SOMETHING });
	// On modal dismiss, the modal will be cleared
	$('#modal').on('hide.bs.modal', function() {
		// clear modal on hide
		$(this).empty();
	});
});

// Login
$(function() {
	$('#login-form input[type="radio"][name="account"]').on('change', function() {
		// remove tenant selection if account type is owner
		var form = $(this).closest('form');
		var account = $(this).val();
		var display = (account === 'users' ? 'block' : 'none');
		form.find('input[name="tenant"]').closest('.form-group').css('display', display);
	});

	$('#sign-up').on('click', function() {
		// load registration form
		$('#modal').load('/modal/registration', function() {
			// load available tenants
			var form = $('#registration-form');
			var select = form.find('select[name="tenant"]');
			select.html('<option disabled selected>Choose a tenant</option>');
			$.get('/db/tenants', function(data) {
				if (data) {
					for (var i = 0; i < data.length; i++) {
						select.append('<option value=' + data[i].tenant_id + '>' + data[i].name + '</option>');
					}
					select.prop('selectedIndex', (data.length > 0 ? 1 : 0));
				}
			}).error(function(jqXHR, textStatus, errorThrown) {
				console.log("Unable to retrieve tenants.");
			});
			$(this).modal('show');
		});
	});
});

// Dashboard
$(function() {
	$('#create-tenant').on('click', function() {
		$('#modal').load('/modal/create_tenant', function() {
			$(this).modal('show');
		});
	});

	$('.manage-tenant').on('click', function() {
		$('#modal').load('/modal/manage_tenant/' + $(this).data('tenant'), function(response, status, xhr) {
			if (xhr.status === 200) {
				$(this).modal('show');
			} else {
				alert('An error has occurred while retrieving tenant information.');
			}
		});
	});

	$('#register-sensor').on('click', function() {
		$('#modal').load('/modal/register_sensor', function() {
			$(this).modal('show');
		});
	});

	$('#create-sensor-template, #create-sensor-group-template').on('click', function() {
		var templateType = $(this).data('template');
		var view = (templateType === 'sensor-group' ? '/sensor_group_template' : '/sensor_template');
		view += '?edit=false';
		$('#modal').load('/modal' + view, function() {
			$(this).modal('show');
		});
	});

	$('.delete-sensor-template, .delete-sensor-group-template').on('click', function() {
		var id = $(this).data('template-id');
		var r = confirm('Are you sure you want to delete this template?');
		if (r) {
			var category = $(this).data('template') === 'sensor-group' ? '/templategrouplist' : '/templatelist';
			$.post('/delete' + category + '/' + id, function(response, textStatus, jqXHR) {
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while deleting the template id #' + id);
			});
		}
	});

	$('.edit-sensor-template, .edit-sensor-group-template').on('click', function() {
		var templateType = $(this).data('template');
		var id = $(this).data('template-id');
		var modalView;
		if (templateType === 'sensor') {
			modalView = '/modal/sensor_template/' + id;
		}
		$('#modal').load(modalView, function(response, status, xhr) {
			if (xhr.status === 200) {
				$(this).modal('show');
			} else {
				alert('An error has occurred while retrieving template id #' + id);
			}
		});
	});

	// sensor owner
	$('.delete-owner-sensor').on('click', function() {
		var r = confirm('Are you sure you want to delete this sensor?');
		if (r) {
			var id = $(this).data('sensor-id');
			$.post('/delete/sensorList/' + id, function(response, textStatus, jqXHR) {
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while deleting the sensor id #' + id);
			});
		}
	});

	// sensor user
	$('#new-sensor-request').on('click', function() {
		$('#modal').load('/users/provision_sensor', function(response, status, xhr) {
			if (xhr.status === 200) {
				$(this).modal('show');
			} else {
				alert('An error has occurred while retrieving sensor catalog.');
			}
		});
	});

	$('#my-account').on('click', function() {
		var email = $(this).data('email');
		var tenant = $(this).data('tenant');
		$('#modal').load('/modal/account', function() {
			$.get('/db/tenants/' + tenant + '/users/' + email, function(data) {
				var form = $('#my-account-form');
				form.find('input[name="name"]').val(data.name);
				form.find('textarea[name="address"]').val(data.address);
				form.find('input[name="email"]').val(data.email);
				form.find('input[name="account"]').val('Sensor User');
				form.find('input[name="tenant"]').val(tenant);
				$('#modal').modal('show');
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while retrieving  user information.');
			});
		});
	});

	$('.edit-collection').on('click', function() {
		var requestId = $(this).data('requestid');
		var frequency = $(this).data('frequency');
		$('#modal').load('/modal/edit_collection?requestid=' + requestId + '&frequency=' + frequency, function() {
			$(this).modal('show');
		});
	});

	// (USER) terminate a sensor
	$('.terminate-sensor').on('click', function() {
		var r = confirm('Are you sure you want to terminate this sensor?');
		if (r) {
			var requestId = $(this).data('request-id');

			$.post('/subscriptions/terminate', {'request_id': requestId}, function(data) {
				alert("Your sensor object request ID#" + requestId + " has been terminated.");
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while terminating your sensor object.');
			});
		}
	});

	// (USER) update sensor status
	$('.control-sensor').on('click', function() {
		var action = $(this).data('action');
		var requestId = $(this).data('request-id');
		var r = confirm('Are you sure you want to ' + action + ' the request ID#' + requestId + '?');
		if (r) {
			$.post('/subscriptions/' + requestId + '/' + (action === 'Disable' ? 'disable' : 'enable'),{}, function(data) {
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while processing your action.');
			});
		}
	});
});