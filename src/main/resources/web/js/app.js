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

	var open = $q.defer();
	eb.onopen = function() {
		$log.log("eventBus opened");
		$rootScope.$apply(open.resolve);
	}

	var closed = $q.defer();
	eb.onclose = function() {
		$log.log("eventBus closed");
		$rootScope.$apply(closed.resolve);
	}

	function ready() {
		return eb.readyState() == 1;
	}

	function send(address, message) {
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

	return {
		open : open.promise,
		closed : closed.promise,
		send : send
	}
});

app.factory("templates", function($rootScope, $q, $log, eventBus) {

	function fetchAll() {
		return eventBus.send("renderer.templates", {
			action : "fetch"
		});
	}

	function fetch(name) {
		return eventBus.send("renderer.templates", {
			action : "fetch",
			name : name
		});
	}

	function submit(name, template) {
		return eventBus.send("renderer.templates", {
			action : "submit",
			name : name,
			template : template
		});
	}

	return {
		fetchAll : fetchAll,
		fetch : fetch,
		submit : submit
	}
});