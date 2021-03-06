// Modal
$(function() {
	// registration
	$('#registration-form').on('change', 'input[type="radio"][name="account"]', function() {
		var form = $(this).closest('form');

		// remove tenant selection if account type is owner
		var account = $(this).val();
		var display = (account === 'owners' ? 'none' : 'block');
		form.find('.additional-fields').css('display', display);

		// load available tenants
		var select = form.find('select[name="tenant"]');
		if (account === 'users') {
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
		}
	}).on('click', 'button[name="email-availability"]', function() {
		var form = $(this).closest('form');
		var email = $(this).prev().val();
		var results = $(this).next();
		//var account = form.find('input[name="account"]:checked').val();
		//var tenant = (account === 'users' ? form.find('select[name="tenant"] option:selected').text() : null);
		var tenant = form.find('select[name="tenant"] option:selected').text();
		// check if email address is available
		$.get('/db/checkemailavailable?email=' + email + '&tenant=' + tenant, function(data) {
			if (data) {
				results.removeClass('text-danger').addClass('text-success').html('Email address is <strong>available</strong>.');
			} else {
				results.removeClass('text-success').addClass('text-danger').html('Email address <strong>already exists</strong>.');
			}
			window.setTimeout(function(){ results.empty(); }, 3000);
		}).error(function(jqXHR, textStatus, errorThrown) {
			console.log("Unable to check email availability.");
		});
	}).on('submit', function() {
		var form = $(this).closest('form');
		var name = $.trim(form.find('input[name="firstname"]').val() + " " + form.find('input[name="lastname"]').val());
		var address = $.trim(form.find('input[name="address1"]').val() + " " + form.find('input[name="address2"]').val());
		var email = $.trim(form.find('input[name="email"]').val());
		var account = form.find('input[name="account"]:checked').val();
		var pass1 = $.trim(form.find('input[name="pass1"]').val());
		var pass2 = $.trim(form.find('input[name="pass2"]').val());
		var tenant = form.find('select[name="tenant"]').val();
		tenant = (tenant ? tenant : '');

		// validation
		var validation = '';
		validation += (account.length > 0 ? '' : '<li>Account Type</li>');
		validation += (name.length > 0 ? '' : '<li>Name</li>');
		validation += (email.length > 0 ? '' : '<li>Email</li>');
		validation += (pass1.length > 0 && pass2.length > 0 ? '' : '<li>Password</li>');
		if (account === 'users') {
			validation += (address.length > 0 ? '' : '<li>Address</li>');
			validation += (tenant.length > 0 ? '' : '<li>Tenant</li>');
		}

		// show error message if validation failed
		if (validation.length > 0) {
			form.find('.validation-error').html('The following fields are required:<br/><ul>' + validation + '</ul>').css('display', 'block');
			return;
		}

		// show error message if passwords do not match
		if (pass1 !== pass2) {
			form.find('input[type="password"]').val('');
			form.find('.validation-error').html('Password does not match.  Please re-enter your password.').css('display', 'block');
			return;
		}

		// show error message if passwords minimum requirements not met
		if (pass1.length < 8) {
			form.find('input[type="password"]').val('');
			form.find('.validation-error').html('Password must be a minimum of 8 characters in length.  Please try again.').css('display', 'block');
			return;
		}

		// create post data
		var postdata = {
			'name': name,
			'email': email,
			'account': account,
			'password': pass1,
		};

		if (account === 'users') {
			postdata['address'] = address;
			postdata['tenant'] = parseInt(tenant); // use tenant_id not tenant name
		}

		$.post('/db/users', postdata, function(data) {
			$('#modal').modal('hide');
			alert('Account created successfully! Please log into your account.');
		}).error(function(jqXHR, textStatus, errorThrown) {
			alert('An error has occurred while processing your account.  Please make sure the email address is available.');
		});
	});

	// admin create tenant form
	$('#create-tenant-form').on('click', 'button[name="tenant-availability"]', function() {
		var input = $(this).prev();
		var results = $(this).next();
		var tenant = input.val();
		if (tenant.length > 0) {
			$.get('/db/checktenantavailable?tenant=' + tenant, function(data) {
				if (data) {
					results.removeClass('text-danger').addClass('text-success').html('Tenant name is <strong>available</strong>.');
				} else {
					results.removeClass('text-success').addClass('text-danger').html('Tenant name <strong>already exists</strong>.');
				}
				window.setTimeout(function(){ results.empty(); }, 3000);
			}).error(function(jqXHR, textStatus, errorThrown) {
				console.log('Unable to retrieve tenant availability');
			});
		}
	}).on('submit', function() {
		var name = $(this).closest('form').find('input[name="tenant"]').val();
		if (name.length > 0) {
			$.post('/db/tenants', { 'name': name }, function(data) {
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while creating tenant.  Please make sure tenant name is available.');
			});
		}
	});

	// user account update
	$('#my-account-form').on('submit', function() {
		var form = $(this).closest('form');
		var data = {
			'name': $.trim(form.find('input[name="name"]').val()),
			'address': $.trim(form.find('textarea[name="address"]').val())
		};

		if (data.name !== '' && data.address !== '') {
			var email = form.find('input[name="email"]').val();
			var tenant = form.find('input[name="tenant"]').val();
			$.post('/db/tenants/' + tenant + '/users/' + email, data, function(data) {
				$('#modal').modal('hide');
				alert('Your account has been updated!');
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while updating your account.');
			});
		}
	});

	// owner register sensor
	$('#register-sensor-form').on('submit', function() {
		var form = $(this).closest('form');
		var elems = form.serializeArray();
		var postdata = {};
		var val;
		for(var i = 0; i < elems.length; i++) {
			val = $.trim(elems[i].value);
			if (val.length > 0) {
				postdata[elems[i].name] = val;
			}
		}
		postdata['id'] = parseInt(postdata['id']);
		if (postdata['id'] !== NaN) {
			$.post('/add/sensorlist', postdata, function(response, textStatus, jqXHR) {
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while registering the sensor.')
			});
		} else {
			alert('Please make sure to enter a valid Sensor ID (must be a number).')
		}
	});

	// admin create new sensor template
	$('#create-sensor-template-form').on('submit', function() {
		var form = $(this).closest('form');
		var elems = form.serializeArray();
		var postdata = {};
		var val;
		for(var i = 0; i < elems.length; i++) {
			val = $.trim(elems[i].value);
			if (val.length > 0) {
				postdata[elems[i].name] = val;
			}
		}
		postdata['templateId'] = parseInt(postdata['templateId']);
		if (postdata['templateId'] !== NaN) {
			if (form.find('input[type="hidden"]').val() === 'edit') {
				$.post('/update/templatelist/' + postdata['templateId'], postdata, function(response, textStatus, jqXHR) {
					window.location.reload();
				}).error(function(jqXHR, textStatus, errorThrown) {
					alert('An error has occurred while updating the sensor template.');
				});
			} else {
				$.post('/add/templatelist', postdata, function(response, textStatus, jqXHR) {
					window.location.reload();
				}).error(function(jqXHR, textStatus, errorThrown) {
					alert('An error has occurred while creating the sensor template.');
				});
			}
		} else {
			alert('Please make sure to enter a valid Template ID (must be a number).')
		}
	});

	// admin create new sensor template
	$('#create-sensor-group-template-form').on('submit', function() {
		var form = $(this).closest('form');
		var elems = form.serializeArray();
		var postdata = {};
		postdata['sensorGroup'] = [];
		var val;
		for(var i = 0; i < elems.length; i++) {
			val = $.trim(elems[i].value);
			if (val.length > 0) {
				if (elems[i].name === 'sensorGroup') {
					// create array of integer for sensor group
					postdata['sensorGroup'].push(parseInt(val));
				} else {
					postdata[elems[i].name] = val;
				}
			}
		}
		postdata['templateGroupId'] = parseInt(postdata['templateGroupId']);
		if (postdata['templateGroupId'] !== NaN) {
			if (form.find('input[type="hidden"]').val() === 'edit') {
				// not available
			} else {
				$.post('/add/templategrouplist', postdata, function(response, textStatus, jqXHR) {
					window.location.reload();
				}).error(function(jqXHR, textStatus, errorThrown) {
					alert('An error has occurred while creating the sensor group template.');
				});
			}
		} else {
			alert('Please make sure to enter a valid Group Template ID (must be a number).')
		}
	});

	// admin update templates available for tenant
	$('#manage-tenant-form').on('submit', function() {
		var form = $(this).closest('form');
		var tenant = form.find('input[name="tenant_name"]').val();

		// get sensor template
		var templatelist = form.find('input[name="templatelist"]:checkbox:checked').map(function() {
			return this.value;
		}).get();
		templatelist = templatelist.join(",");

		// get sensor group template
		var templategrouplist = form.find('input[name="templategrouplist"]:checkbox:checked').map(function() {
			return this.value;
		}).get();
		templategrouplist = templategrouplist.join(",");

		var postdata = {
			'templates': templatelist,
			'group_templates': templategrouplist
		};
		$.post('/db/tenants/' + tenant + '/templates', postdata, function(data) {
			window.location.reload();
		}).error(function(jqXHR, textStatus, errorThrown) {
			alert('An error has occurred while updating the tenant ' + tenant);
		});
	});

	// (USER) provision sensor template
	$('.provision-sensor').on('click', function() {
		var r = confirm('You are about to provision a new sensor object.  Please confirm this action to continue.');
		if (r) {
			var templateType = $(this).data('template-type');
			var userId = $(this).data('user-id');
			var tenantId = $(this).data('tenant-id');
			var templateId = $(this).data('template-id');

			var postdata = {
				'user_id': userId,
				'tenant_id': tenantId,
				'template_type': templateType
			};
			postdata[templateType] = templateId;
			
			$.post('/subscriptions', postdata, function(data) {
				alert('Successfully provisioned sensor request!');
				window.location.reload();
			}).error(function(jqXHR, textStatus, errorThrown) {
				alert('An error has occurred while provision then sensor request.');
			});
		}
	});
});