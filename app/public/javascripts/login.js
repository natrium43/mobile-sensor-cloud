$(function() {
	$('#login-form input[type="radio"][name="type"]').on('change', function() {
		// remove tenant selection if account type is owner
		var form = $(this).closest('form');
		var type = $(this).val();
		var display = (type === 'owner' ? 'none' : 'block');
		form.find('select[name="tenant"]').closest('.form-group').css('display', display);
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