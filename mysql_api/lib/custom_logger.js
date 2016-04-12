// custom logger for console

var Logger = {
	INFO: function(msg) {
		console.log(msg)
	},

	ERROR: function(msg) {
		console.log("ERROR: " + msg);
	},

	DEBUG: function(method, url, data) {
		console.log("\n===== [" + (new Date()).toString() + "] =====");
		console.log("REQUEST:");
		console.log("  method: " + method);
		console.log("  url: " + url);
		console.log("  data: " + JSON.stringify(data));
	}
};

module.exports = Logger;