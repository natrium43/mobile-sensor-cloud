var _GLOBAL = {
	// return true if session exists
	valid_session: function(sess, req, res) {
		if (sess.account == undefined || sess.email == undefined) {
			req.session.destroy();
			res.redirect('/login');
			return false;
		}
		return true;
	},

	config: {
		'db_server': 'http://127.0.0.1:3001'
	}
}

module.exports = _GLOBAL;