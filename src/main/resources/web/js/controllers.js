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

	$scope.script = null;

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

function TemplateList($scope, $log, eventBus, templates) {

	$scope.templateName = null;
	$scope.templates = [];

	$scope.add = function() {
		var template = {
			name : $scope.templateName,
			template : "test-template"
		};
		if (isDuplicate(template.name)) {
			$log.warn("duplicate template name");
		} else {
			$scope.templates.push(template);
			$scope.templateName = null;
		};
	}

	$scope.fetchTemplates = function() {
		templates.fetchAll().then(updateTemplates);
	}

	$scope.deleteTemplate = function(index) {
		$scope.templates.splice(index, 1);
	}

	function isDuplicate(name) {
		return _.contains(_.pluck($scope.templates, "name"), name);
	}

	function updateTemplates(reply) {
		$scope.templates = [];
		angular.forEach(reply.templates, function(template, index) {
			$scope.templates.push({
				name : template.name,
				template : template.template
			});
		});
	}

	eventBus.open.then($scope.fetchTemplates);
}

function TemplateEdit($scope, $routeParams, $log, eventBus, templates) {

	$scope.name = $routeParams.name;
	$scope.template = null;

	$scope.fetchTemplate = function(name) {
		$scope.template = templates.fetch(name);
	}

	eventBus.open.then(function() {
		$scope.fetchTemplate($scope.name);
	});
}