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
	}

	$scope.fetch = function() {
		eventBus.send("extractor.dispatchRule", {
			action : "fetch"
		}).then(updateScript);
	}

	function updateScript(reply) {
		$scope.script = reply.script;
	}

	eventBus.open.then($scope.fetch);
}

function TemplateList($scope, $log, $location, eventBus, templates) {

	$scope.templateName = null;
	$scope.templates = [];

	$scope.fetchTemplates = function() {
		templates.fetchAll().then(updateTemplates);
	}

	$scope.add = function() {
		var template = {
			name : $scope.templateName,
			template : ""
		}
		if (isDuplicate(template.name)) {
			$log.warn("duplicate template name");
		} else {
			$scope.templateName = null;
			templates.submit(template.name, template.template).then(function() {
				$location.path("/templates/" + template.name);
			});
		}
	}

	$scope.deleteTemplate = function(index) {
		$scope.templates.splice(index, 1);
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

	function isDuplicate(name) {
		return _.contains(_.pluck($scope.templates, "name"), name);
	}

	eventBus.open.then($scope.fetchTemplates);
}

function EditTemplate($scope, $routeParams, $log, eventBus, templates) {

	$scope.name = $routeParams.name;
	$scope.template = null;

	$scope.fetchTemplate = function(name) {
		templates.fetch(name).then(function(reply) {
			$scope.template = reply.template;
		}, function(error) {
			// TODO error message
		});
	}

	$scope.submitTemplate = function(template) {
		templates.submit($scope.name, template).then(function(reply) {
			// TODO success message
		}, function(error) {
			// TODO error message
		})
	}

	eventBus.open.then($scope.fetchTemplate($scope.name));
}

function EditScript($scope, $routeParams, $log, eventBus, templates) {

	$scope.name = $routeParams.name;
	$scope.script = null;

}