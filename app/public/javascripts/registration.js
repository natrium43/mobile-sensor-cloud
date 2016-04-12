$(function() {
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
			REST.getTenants(function(data){
				if (data) {
					for (var i = 0; i < data.length; i++) {
						select.append('<option value=' + data[i].tenant_id + '>' + data[i].name + '</option>');
					}
					select.prop('selectedIndex', (data.length > 0 ? 1 : 0));
				}
			});
		}
	}).on('click', 'button[name="email-availability"]', function() {
		var form = $(this).closest('form');
		var email = $(this).prev().val();
		var results = $(this).next();
		var account = form.find('input[name="account"]:checked').val();
		var tenant = (account === 'users' ? form.find('select[name="tenant"] option:selected').text() : null);

		// check if email address is available
		REST.checkEmailAvailable(account, email, tenant, function(data) {
			if (data) {
				results.removeClass('text-danger').addClass('text-success').html('Email address is <strong>available</strong>.');
			} else {
				results.removeClass('text-success').addClass('text-danger').html('Email address <strong>already exists</strong>.');
			}
			window.setTimeout(function(){ results.empty(); }, 3000);
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

		REST.addUser(account, postdata, function(data){
			if (data) {
				$('#modal').modal('hide');
				alert('Account created successfully! Please log into your account.');
			} else {
				alert('An error has occurred while processing your account.  Please try again later.');
			}
		});
	});
});