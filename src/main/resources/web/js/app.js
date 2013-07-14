var app = angular.module("iteraMock", []);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when("/settings", {
		templateUrl : "settings.html",
		controller : Settings
	}).when("/dispatch", {
		templateUrl : "dispatch.html",
		controller : Dispatch
	}).when("/templates", {
		templateUrl : "template-list.html",
		controller : TemplateList
	}).when("/templates/:name", {
		templateUrl : "edit-template.html",
		controller : EditTemplate
	}).when("/templates/script/:name", {
		templateUrl : "edit-script.html",
		controller : EditScript
	}).when("/test", {
		templateUrl : "test.html",
		controller : Test
	}).otherwise({
		redirectTo : "/settings"
	});
}]);

app.factory("eventBus", function($rootScope, $location, $q, $log, messages) {

	$log.log("initializing eventBus");
	eb = new vertx.EventBus($location.protocol() + "://" + $location.host() + ":" + $location.port() + "/eventbus");

	var q_open = $q.defer();
	this.open = q_open.promise;
	eb.onopen = function() {
		$log.log("eventBus opened");
		$rootScope.$apply(q_open.resolve);
	}

	var q_closed = $q.defer();
	this.closed = q_closed.promise;
	eb.onclose = function() {
		$log.log("eventBus closed");
		$rootScope.$apply(q_closed.resolve);
	}

	function ready() {
		return eb.readyState() == 1;
	}

	this.send = function(address, message) {
		var response = $q.defer();
		if (ready()) {
			eb.send(address, message, function(reply) {
				$log.log("sending " + JSON.stringify(message) + " to address " + address);
				$rootScope.$apply(function() {
					$log.log("got reply " + JSON.stringify(reply));
					if ("ok" == reply.status) {
						response.resolve(reply);
						messages.addSuccess();
					} else {
						response.reject(reply.message);
						messages.addError(reply.message);
					}
				});
			});
		} else {
			var errorMsg = "EventBus not ready, please reload page!";
			messages.addError(errorMsg);
		}
		return response.promise;
	}

	return this;
});

app.factory("settings", function(eventBus) {

	this.fetch = function(name) {
		return eventBus.send("mockserver.settings", {
			action : "fetch"
		});
	}

	this.submit = function(settings) {
		console.log(settings);
		return eventBus.send("mockserver.settings", {
			action : "submit",
			settings : settings
		});
	}

	return this;
});

app.factory("templates", function(eventBus) {

	this.fetchAll = function() {
		return eventBus.send("renderer.templates", {
			action : "fetch"
		});
	}

	this.fetch = function(name) {
		return eventBus.send("renderer.templates", {
			action : "fetch",
			name : name
		});
	}

	this.submit = function(name, template) {
		return eventBus.send("renderer.templates", {
			action : "submit",
			name : name,
			template : template
		});
	}

	return this;
});

app.factory("dispatchRule", function(eventBus) {

	this.fetch = function() {
		return eventBus.send("extractor.dispatchRule", {
			action : "fetch"
		});
	}

	this.submit = function(script) {
		return eventBus.send("extractor.dispatchRule", {
			action : "submit",
			script : script
		});
	}

	return this;
});

app.factory("extractScripts", function(eventBus) {

	this.fetch = function(name) {
		return eventBus.send("extractor.extractScripts", {
			action : "fetch",
			name : name
		});
	}

	this.submit = function(name, script) {
		return eventBus.send("extractor.extractScripts", {
			action : "submit",
			name : name,
			script : script
		});
	}

	return this;
});

app.factory("messages", function($timeout) {

	var messages = [];

	var addMessage = function(alertClass, head, text) {
		if (messages.length > 4) {
			messages.splice(0, 1);
		}
		messages.push({
			alertClass : alertClass,
			head : head,
			text : text
		});
	}

	this.addSuccess = function() {
		addMessage("alert-success", "Ok!");
		timedRemove(messages, 3000);
	}

	this.addError = function(text) {
		addMessage("alert-error", "Error!", text);
		timedRemove(messages, 10000);
	}

	this.remove = function(index) {
		messages.splice(index, 1);
	}

	this.removeAll = function(index) {
		messages = [];
	}

	var timedRemove = function(messages, timeout) {
		$timeout(function() {
			messages.splice(0, 1);
		}, timeout);
	}

	this.messages = messages;
	return this;
});