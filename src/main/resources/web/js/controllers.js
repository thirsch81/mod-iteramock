function Main($scope, $location, $log, messages, eventBus) {

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

function Settings($scope, settings, eventBus) {

	$scope.settings = {};

	$scope.submit = function(map) {
		settings.submit(map);
	}

	$scope.fetch = function() {
		settings.fetch().then(updateSettings);
	}

	function updateSettings(reply) {
		$scope.settings = reply.settings;
	}

	eventBus.open.then($scope.fetch);
}

function Dispatch($scope, dispatchRule, eventBus) {

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

function TemplateList($scope, $log, $location, templates, eventBus) {

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

function EditTemplate($scope, $routeParams, templates, eventBus) {

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

function EditScript($scope, $routeParams, extractScripts, eventBus) {

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

function Test($scope, $location, $http, $log, settings, eventBus) {

	$http.defaults.useXDomain = true;
	$http.defaults.headers.post["Content-Type"] = "application/xml";
	$scope.request = null;
	$scope.response = null;

	var port = null;
	var path = null;

	$scope.submitTest = function(request) {
		var url = $location.protocol() + "://" + $location.host() + ":" + port + "/" + path;
		$http.post(url, request).then(updateResponse);
	}

	function updateResponse(response) {
		$scope.response = response.data;
	}

	eventBus.open.then(function() {
		settings.fetch().then(function(reply) {
			port = reply.settings.servicePort
			path = reply.settings.servicePath
		});
	});

}