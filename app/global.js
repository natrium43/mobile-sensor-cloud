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
		'user_db': 'http://127.0.0.1:3001',
		'sensor_db': 'http://127.0.0.1:3002',
		'monitor': 'http://127.0.0.1:3003'
	}
}

module.exports = _GLOBAL;