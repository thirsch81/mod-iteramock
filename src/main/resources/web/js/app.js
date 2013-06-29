var app = angular.module("iteraMock", []);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when("/general", {
		templateUrl : "general.html",
		controller : General
	}).when("/dispatch", {
		templateUrl : "dispatch.html",
		controller : Dispatch
	}).when("/templates", {
		templateUrl : "templates.html",
		controller : TemplateList
	}).when("/templates/edit/:name", {
		templateUrl : "edit-template.html",
		controller : TemplateEdit
	}).otherwise({
		redirectTo : "/general"
	});
}]);

app.factory("eventBus", function($rootScope, $q, $log) {

	$log.log("initializing eventBus");
	eb = new vertx.EventBus("http://localhost:8080/eventbus");

	var open = $q.defer();
	eb.onopen = function() {
		$log.log("eventBus opened", eb.readyState());
		$rootScope.$apply(function() {
			open.resolve(true);
		});
	}

	var closed = $q.defer();
	eb.onclose = function() {
		$log.log("eventBus closed", eb.readyState());
		$rootScope.$apply(function() {
			closed.resolve(true);
		});
	}

	function ready() {
		return eb.readyState() == 1;
	}

	function send(address, message) {
		var response = $q.defer();
		if (ready()) {
			$log.log("sending " + JSON.stringify(message) + " to address " + address);
			eb.send(address, message, function(reply) {
				$log.log("got reply " + JSON.stringify(reply));
				$rootScope.$apply(function() {
					response.resolve(reply);
				});
			});
		} else {
			$log.warn("eventBus not ready, can't send " + JSON.stringify(message) + " to address " + address)
		}
		return response.promise;
	}

	return {
		open : open.promise,
		closed : closed.promise,
		send : send
	}
});