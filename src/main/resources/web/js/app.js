var app = angular.module("iteraMock", []);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when("/general", {
		templateUrl : "general.html",
		controller : General
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
	}).otherwise({
		redirectTo : "/general"
	});
}]);

app.factory("eventBus", function($rootScope, $location, $q, $log) {

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
			$log.log("sending", JSON.stringify(message), "to address", address);
			eb.send(address, message, function(reply) {
				$log.log("got reply " + JSON.stringify(reply));
				$rootScope.$apply(function() {
					if ("ok" == reply.status) {
						response.resolve(reply);
					} else {
						response.reject(reply.message);
					}
				});
			});
		} else {
			$log.warn("eventBus not ready, can't send", JSON.stringify(message), "to address", address)
		}
		return response.promise;
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