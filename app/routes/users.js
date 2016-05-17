var _GLOBAL = require('../global');
var express = require('express');
var router = express.Router();
var request = require('request'); // handle HTTP requests

// base
router.get('/users', function(req, res, next) {
	res.redirect('/users/sensor-management');
});

router.get('/users/sensor-management', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	var render = {
		title: 'User Dashboard',
		session: sess,
		section: 'sensor-management',
		response: []
	};
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions',
		json: true,
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}
		var data = [];
		if (body.length > 0) {
			for (var i = 0; i < body.length; i++) {
				(function(i) {
					var sub = body[i];
					request.get({
						url: _GLOBAL.config.sensor_db + '/userSensors/request/' + sub.request_id + '/template/' + sub.template_id,
						json: true,
					}, function(error, response, innerBody) {
						if (error) {
							res.status(400).send();
							return;
						}

						// merge objects
						for (var prop in innerBody) {
							sub[prop === 'status' ? 'sensor_status' : prop] = innerBody[prop];
						}

						//console.log(JSON.stringify(sub, undefined, 4));
						data.push(sub);

						// exit
						if ((i + 1) == body.length) {
							setTimeout(function() {
								render['response'] = data;
								res.render(path.substring(1), {
									render: render
								});
							}, 1000);
						}
					});
				})(i);
			}
		} else {
			res.render(path.substring(1), {
				render: render
			});
		}
	});
});

router.get('/users/sensor-controller', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	var render = {
		title: 'User Dashboard',
		session: sess,
		section: 'sensor-controller',
		response: []
	};
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions/active',
		json: true,
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}
		var data = [];
		if (body.length > 0) {
			for (var i = 0; i < body.length; i++) {
				(function(i) {
					var sub = body[i];
					request.get({
						url: _GLOBAL.config.sensor_db + '/userSensors/request/' + sub.request_id + '/template/' + sub.template_id,
						json: true,
					}, function(error, response, innerBody) {
						if (error) {
							res.status(400).send();
							return;
						}

						// merge objects
						for (var prop in innerBody) {
							sub[prop === 'status' ? 'sensor_status' : prop] = innerBody[prop];
						}

						console.log(JSON.stringify(sub, undefined, 4));
						data.push(sub);

						// exit
						if ((i + 1) == body.length) {
							setTimeout(function() {
								render['response'] = data;
								res.render(path.substring(1), {
									render: render
								});
							}, 1000);
						}
					});
				})(i);
			}
		} else {
			res.render(path.substring(1), {
				render: render
			});
		}
	});
});

router.get('/users/sensor-monitor', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	var render = {
		title: 'User Dashboard',
		session: sess,
		section: 'sensor-monitor',
		response: {
			graph: {
				cities: JSON.stringify([]),
				hours: JSON.stringify([])
			},
			data: []
		}
	};
	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions/active',
		json: true,
	}, function(error, response, body) {
		if (error) {
			res.status(400).send();
			return;
		}
		var sensorData = [];
		if (body.length > 0) {
			for (var i = 0; i < body.length; i++) {
				(function(i) {
					var sub = body[i];
					request.get({
						url: _GLOBAL.config.vsensor + '/GetSensorFields/' + sub.request_id,
						json: true,
					}, function(error, response, innerBody) {
						if (error) {
							res.status(400).send();
							return;
						}

						if (innerBody && innerBody.length > 0) {
							for (var j = 0; j < innerBody.length; j++) {
								sensorData.push(innerBody[j]);
							}
						}

						// exit
						if ((i + 1) == body.length) {
							setTimeout(function() {
								parseSensorData(sensorData);
							}, 1000);
						}
					});
				})(i);
			}
		} else {
			res.render(path.substring(1), {
				render: render
			});
		}
	});

	function parseSensorData(sensorData) {
		// parse data by cities
		var tempCities = {};
		var cities = {};
		for (var i = 0; i < sensorData.length; i++) {
			var t = sensorData[i];
			if (!tempCities.hasOwnProperty(t.ReportingArea)) {
				tempCities[t.ReportingArea] = [];
				cities[t.ReportingArea] = {
					'O3': {
						'aqi': [],
					},
					'PM2.5': {
						'aqi': [],
					},
					'PM10': {
						'aqi': [],
					},
					'dates': []
				};
			}
			tempCities[t.ReportingArea].push(t);
		}

		// parse data for different parameter names
		for (var city in tempCities) {
			var c = tempCities[city];
			var count = 0;
			for (var i = 0; i < c.length; i++) {
				cities[city][c[i].ParameterName]['aqi'].push(c[i].AQI);
				if (count == 0) {
					cities[city]['dates'].push(c[i].DateObserved);
				}
				count++;
				count = (count > 2 ? 0 : count);
			}
		}

		var _color = {
			border: function(offset) {
				g = (128 - offset >= 0 ? 128 - offset : 128 + offset);
				b = (255 - offset >= 0 ? 255 - offset : 0);
				return "rgba(0," + g + "," + b + ", 1)";
			},
			background: function(offset) {
				g = (128 - offset >= 0 ? 128 - offset : 128 + offset);
				b = (255 - offset >= 0 ? 255 - offset : 0);
				return "rgba(0," + g + "," + b + ",0.5)";
			}
		};

		var _colors = [
			{
				"border": "rgba(255,0,0,1)",
				"background": "rgba(255,0,0,0.5)"
			},
			{
				"border": "rgba(72,61,139,1)",
				"background": "rgba(72,61,139,0.5)"
			},
			{
				"border": "rgba(0,0,255,1)",
				"background": "rgba(0,0,255,0.5)"
			},
			{
				"border": "rgba(0,255,255,1)",
				"background": "rgba(0,255,255,0.5)"
			},
			{
				"border": "rgba(255,0,255,1)",
				"background": "rgba(255,0,255,0.5)"
			},
			{
				"border": "rgba(0,255,0,1)",
				"background": "rgba(0,255,0,0.5)"
			}
		];

		var cityGraphs = [];
		for (var city in cities) {
			var offset = 0;
			var c = cities[city];
			var labels = c.dates;
			var datasets = [];
			for (var param in c) {
				if (param !== 'dates') {
					datasets.push({
						label: param,
						borderColor: _colors[offset].border,
						backgroundColor: _colors[offset].background,
						data: c[param].aqi
					});
					offset++;
				}
			}
			cityGraphs.push({
				'labels': labels,
				'datasets': datasets,
				'title': city
			});
		}
		console.log(JSON.stringify(cityGraphs, undefined, 4));

		res.render(path.substring(1), {
			render: {
				title: 'User Dashboard',
				session: sess,
				section: 'sensor-monitor',
				response: {
					graph: JSON.stringify(cityGraphs),
					data: sensorData
				}
			}
		});
	}
});

router.get('/users/cost-management', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }

	var data = {
		'account': {},
		'billing': []
	};

	request.get({
		url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email,
		json: true,
	}, function(error, response, body) {
		if (error && response.statusCode == 400) {
			res.status(400).send();
			return;
		}

		data['account'] = body;

		request.get({
			url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant + '/users/' + sess.email + '/subscriptions',
			json: true,
		}, function(error, response, body) {
			if (error) {
				res.status(400).send();
				return;
			}

			if (body.length > 0) {
				for (var i = 0; i < body.length; i++) {				
					(function(i) {
						var sub = body[i];
						request.get({
							url: _GLOBAL.config.vsensor + '/SensorObjectUsage/' + sub.request_id,
							json: true,
						}, function(error, response, innerBody) {
							if (error) {
								res.status(400).send();
								return;
							}

							console.log(JSON.stringify(innerBody, undefined, 4));
							var usage = innerBody.usage;
							data.billing.push({
								'requestId': sub.request_id,
								'status': sub.status,
								'usage': usage,
								'rate': 0.034,
								'cost': (usage * 0.034)
							});

							// exit
							if ((i + 1)  == body.length) {
								setTimeout(function() {
									res.render(path.substring(1), {
										render: {
											title: 'User Dashboard',
											session: sess,
											section: 'cost-management',
											response: data
										}
									});
								}, 1000);
							}
						});
					})(i);
				}
			} else {
				res.render(path.substring(1), {
					render: {
						title: 'User Dashboard',
						session: sess,
						section: 'cost-management',
						response: data
					}
				});
			}
		});
	});
});

router.get('/users/account', function(req, res, next) {
	var sess = req.session;
	var path = req.path;
	if (!_GLOBAL.valid_session(sess, req, res)) { return; }
	res.render(path.substring(1), {
		render: {
			title: 'User Dashboard',
			session: sess,
			section: 'account'
		}
	});
});

router.get('/users/provision_sensor', function(req, res, next) {
	var sess = req.session;
	var params = req.params;
	var templatelist = [];
	var templategrouplist = [];
	request.get({
		url: _GLOBAL.config.sensor_db + '/templatelist',
		json: true,
	}, function(error, response, body) {
		if (!error && body) {
			templatelist = body;
		}
		request.get({
			url: _GLOBAL.config.sensor_db + '/templategrouplist',
			json: true,
		}, function(error, response, body) {
			if (!error && body) {
				templategrouplist = body;
			}
			request.get({
				url: _GLOBAL.config.user_db + '/tenants/' + sess.tenant,
				json: true,
			}, function(error, response, body) {
				if (!error && body) {
					// get templates
					var templates = body.templates;
                    templates = templates ? templates.split(",").map(function(v) { return parseInt(v); }) : [];
                    // get group templates
                    var gTemplates = body.group_templates;
                    gTemplates = gTemplates ? gTemplates.split(",").map(function(v) { return parseInt(v); }) : [];
                    
                    var data = {
                    	'templates': [],
                    	'group_templates': []
                    };

                    // filter templatelist
                    for (var i = 0; i < templatelist.length; i++) {
                    	if (templates.indexOf(templatelist[i].templateId) > -1) {
                    		data['templates'].push(templatelist[i]);
                    	}
                    }

                     // filter templategrouplist
                    for (var i = 0; i < templategrouplist.length; i++) {
                    	if (gTemplates.indexOf(templategrouplist[i].templateGroupId) > -1) {
                    		data['group_templates'].push(templategrouplist[i]);
                    	}
                    }
                    console.log(sess);
					res.render('modal/provision_sensor', {
						render: {
							response: data,
							session: sess
						}
					});
					return;
				}
				res.status(500).send();
			});
		});
	});
});

// make POST call to users_id rest api to create subscription
router.post('/subscriptions', function(req, res, next) {
	var payload = req.body;
	console.log(payload);
	request.post({
		url: _GLOBAL.config.user_db + '/subscriptions',
		json: true,
		body: payload
	}, function(error, response, body) {
		if (!error && response.statusCode === 201) {
			var requestId = body.request_id;
			console.log(body);
			var provisionPayload = {
				"requestId": requestId,
				"templateId": payload.templateId
			};
			console.log("PROVISION Payload: " + JSON.stringify(provisionPayload));

			// provision sensor
			request.post({
				url: _GLOBAL.config.sensor_db + '/provisionSensor',
				json: true,
				body: provisionPayload
			}, function(error, response, body) {
				if (error || response.statusCode === 400) {
					// provisioning unsuccessful - terminate subscription immediately
					request.put({
						url: _GLOBAL.config.user_db + '/subscriptions/' + requestId + '/terminate',
						json: true,
					}, function(error, response, body) {
						if (error) {
							console.log(error);
						}
					});

					res.status(400).send();
					return;
				}
				res.status(201).send();
			});
		} else {
			res.status(400).send();
		}
	});	
});

// make POST call to users_id rest api to create subscription
router.post('/subscriptions/terminate', function(req, res, next) {
	var payload = req.body;
	var url = _GLOBAL.config.vsensor + '/TerminateSensorObject/' + payload.request_id;
	request.get(url, function(error, response, body) {
		if (error || response.statusCode === 400) {
			res.status(400).send();
			return;
		} else {
			request.put({
				url: _GLOBAL.config.user_db + '/subscriptions/' + payload.request_id + '/terminate',
				json: true
			}, function(error, response, body) {
				if (!error && response.statusCode === 204) {
					res.status(204).send();
					return;
				}
				res.status(400).send();
			});
		}
	});
});

// control sensor state
// action can be "enable" or "disable"
router.post('/subscriptions/:request_id/:action', function(req, res, next) {
	var params = req.params;
	var url = _GLOBAL.config.vsensor;
	url += (params.action === 'disable' ? '/DisableSensorObject' : '/EnableSensorObject');
	url += '/' + params.request_id;
	request.get(url, function(error, response, body) {
		if (error || response.statusCode === 400) {
			res.status(400).send();
			return;
		}
		res.send();
	});
});

module.exports = router;