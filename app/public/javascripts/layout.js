/* global functions and listeners */

$(function() {
	// this is a global modal used throughout the application
	// To load a view into the modal, use jquery.load('/modal/view_name', function(){ DO SOMETHING });
	// On modal dismiss, the modal will be cleared
	$('#modal').on('hide.bs.modal', function() {
		// clear modal on hide
		$(this).empty();
	});
});