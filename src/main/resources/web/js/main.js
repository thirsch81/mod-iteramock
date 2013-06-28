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
		controller : TemplateCtrl
	}).when("/templates/edit/:name", {
		templateUrl : "edit-template.html",
		controller : TemplateCtrl
	}).otherwise({
		redirectTo : "/general"
	});
}]);

app.factory("eventBus", function($rootScope, $q, $log) {

	var eb = null;
	var open = $q.defer();
	var closed = $q.defer();

	$log.log("initializing eventBus");
	eb = new vertx.EventBus("http://localhost:8080/eventbus");
	eb.onopen = function() {
		$log.log("eventBus opened", eb.readyState());
		$rootScope.$apply(function() {
			open.resolve(true);
		});
	}
	eb.onclose = function() {
		$log.log("eventBus closed", eb.readyState());
		eb = null;
		$rootScope.$apply(function() {
			closed.resolve(true);
		});
	}

	function send(address, message) {
		var response = $q.defer();
		if (eb && eb.readyState() == 1) {
			$log.log("sending " + JSON.stringify(message) + " to address " + address);
			eb.send(address, message, function(reply) {
				$log.log("got reply " + JSON.stringify(reply));
				$rootScope.$apply(function() {
					response.resolve(reply);
				});
			});
		} else {
			$log.warn("eventBus not ready, can't send")
		}
		return response.promise;
	}

	return {
		open : open.promise,
		closed : closed.promise,
		send : send
	}
});

function Main($scope, $location, $log, eventBus) {

	$scope.status = "waiting";
	$scope.statusClass = "text-warning";

	eventBus.open.then(function() {
		$scope.status = "connected";
		$scope.statusClass = "text-success";
	});
	eventBus.closed.then(function() {
		$scope.status = "disconnected";
		$scope.statusClass = "text-error";
	});

	$scope.isActive = function(route) {
		var regex = RegExp(route);
		return regex.test($location.path());
	}
}

function General($scope, eventBus) {

}