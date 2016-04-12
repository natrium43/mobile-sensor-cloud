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
			$(this).modal('show');
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	});
});