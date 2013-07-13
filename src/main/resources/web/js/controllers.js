function Main($scope, $location, $log, eventBus, messages) {

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

	$scope.isActive = function(entry) {
		var regex = RegExp(entry);
		return regex.test($location.path());
	}

	$scope.messages = messages.messages;

	$scope.removeMessage = function(index) {
		messages.remove(index);
	}
}

function General($scope, eventBus) {

}

function Dispatch($scope, eventBus, dispatchRule) {

	$scope.script = null;

	$scope.submit = function(script) {
		dispatchRule.submit(script);
	}

	$scope.fetch = function() {
		dispatchRule.fetch().then(updateScript);
	}

	function updateScript(reply) {
		$scope.script = reply.script;
	}

	eventBus.open.then($scope.fetch);
}

function TemplateList($scope, $log, $location, eventBus, templates) {

	$scope.templateName = null;
	$scope.templates = [];

	$scope.add = function() {
		var name = $scope.templateName
		if (isDuplicate(name)) {
			$log.warn("duplicate template name");
		} else {
			templates.submit(name, "").then(function() {
				$location.path("/templates/" + name);
			});
			$scope.templateName = null;
		}
	}

	$scope.deleteTemplate = function(name) {
		var index = $scope.templates.indexOf(name);
		$scope.templates.splice(index, 1);
	}

	$scope.fetchTemplates = function() {
		templates.fetchAll().then(updateTemplates);
	}

	function updateTemplates(reply) {
		$scope.templates = [];
		angular.forEach(reply.templates.sort(), function(template) {
			$scope.templates.push(template);
		});
	}

	function isDuplicate(name) {
		return arr.indexOf(name) != -1;
	}

	eventBus.open.then($scope.fetchTemplates);
}

function EditTemplate($scope, $routeParams, eventBus, templates) {

	$scope.name = $routeParams.name;
	$scope.template = null;

	$scope.fetchTemplate = function(name) {
		templates.fetch(name).then(function(reply) {
			$scope.template = reply.template;
		}, function(error) {
			// TODO error message
		});
	}

	$scope.submitTemplate = function(name, template) {
		templates.submit(name, template).then(function(reply) {
			// TODO success message
		}, function(error) {
			// TODO error message
		})
	}

	eventBus.open.then(function() {
		$scope.fetchTemplate($scope.name);
	});
}

function EditScript($scope, $routeParams, eventBus, extractScripts) {

	$scope.name = $routeParams.name;
	$scope.script = null;

	$scope.fetchScript = function(name) {
		extractScripts.fetch(name).then(updateScript);
	}

	$scope.submitScript = function(name, script) {
		extractScripts.submit(name, script);
	}

	function updateScript(reply) {
		$scope.script = reply.script;
	}

	eventBus.open.then(function() {
		$scope.fetchScript($scope.name);
	});
}

function Test($scope, $location, $http, $log) {

	$scope.request = null;
	$scope.response = null;

	$scope.submitTest = function(request) {
		// TODO inject configuration object for different url
		var url = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/render";
		$http.post(url, request).then(updateResponse);
	}

	function updateResponse(response) {
		$log.log(response);
		$scope.response = response.data;
	}
}