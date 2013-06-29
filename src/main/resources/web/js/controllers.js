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

function Dispatch($scope, eventBus) {

	$scope.script = "";

	$scope.submit = function() {
		eventBus.send("extractor.dispatchRule", {
			action : "submit",
			script : $scope.script
		});
	};

	$scope.fetch = function() {
		eventBus.send("extractor.dispatchRule", {
			action : "fetch"
		}).then(updateScript);
	};

	function updateScript(reply) {
		$scope.script = reply.script;
	};

	eventBus.open.then(function() {
		$scope.fetch();
	});
}

function TemplateList($scope, $log, eventBus) {

	$scope.add = function() {
		var template = {
			name : $scope.templateName,
			template : "test-template"
		};
		if (isDuplicate(template.name)) {
			$log.warn("duplicate template name");
		} else {
			$scope.templates.push(template);
			$scope.templateName = "";
		};
	}

	$scope.fetchTemplates = function() {
		return eventBus.send("renderer.templates", {
			action : "fetch"
		}).then(updateTemplates);
	}

	$scope.deleteTemplate = function(index) {
		$scope.templates.splice(index, 1);
	}

	function isDuplicate(name) {
		return _.contains(_.pluck($scope.templates, "name"), name);
	}

	function updateTemplates(reply) {
		if (reply.status == "ok") {
			$scope.templates = [];
			angular.forEach(reply.templates, function(template, index) {
				$scope.templates.push({
					name : template.name,
					template : template.template
				});
			});
		};
	}

	$scope.templateName = "";
	$scope.templates = [];

	eventBus.open.then($scope.fetchTemplates);
}

function TemplateEdit($scope, $routeParams, $log, eventBus) {

	$scope.name = $routeParams.name;
	$scope.template = "";

	// TODO refactor this duplicated method
	$scope.fetchTemplates = function() {
		return eventBus.send("renderer.templates", {
			action : "fetch"
		}).then(updateTemplates);
	}

	// TODO refactor this duplicated method
	function updateTemplates(reply) {
		if (reply.status == "ok") {
			$scope.templates = [];
			angular.forEach(reply.templates, function(template, index) {
				$scope.templates.push({
					name : template.name,
					template : template.template
				});
			});
		};
	}

	eventBus.open.then(function() {
		$scope.fetchTemplates().then(function() {
			$scope.template = getTemplate($routeParams.name).template;
		});
	});

	$scope.submit = function() {
		eventBus.send("renderer.templates", {
			"action" : "submit",
			"name" : $scope.name,
			"template" : $scope.template
		});
	}

	function getTemplate(name) {
		console.log(JSON.stringify(name));
		var result = {};
		angular.forEach($scope.templates, function(template, index) {
			if (template.name == name) {
				result = template;
			}
		});
		console.log(JSON.stringify(result));
		return result;
	}
}