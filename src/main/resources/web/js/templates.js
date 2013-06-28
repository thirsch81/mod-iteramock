function TemplateCtrl($scope, $routeParams, eventBus) {

	$scope.add = function() {
		var template = {
			name : $scope.templateName,
			template : "test-template"
		};
		if (isDuplicate(template.name)) {
			showErrorMessage("Duplicate template name!")
		} else {
			$scope.templates.push(template);
			$scope.templateName = "";
			setTimeout(function() {
				$("#template-tabs a[href='#" + template.name + "']").click();
			});
		};
	}

	$scope.fetchTemplates = function() {
		eventBus.send("renderer.templates", {
			action : "fetch"
		}, updateTemplates);
	}

	$scope.deleteTemplate = function(index) {
		$scope.templates.splice(index, 1);
	}

	$scope.submit = function() {
		eventBus.send("renderer.templates", {
			"action" : "submit",
			"name" : activeTemplate(),
			"template" : activeTemplateContent()
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

	function isDuplicate(name) {
		return _.contains(_.pluck($scope.templates, "name"), name);
	}

	function activeTemplate() {
		return $("#template-tabs li.active a").text();
	}

	function activeTemplateContent() {
		return $("#template-container div.active textarea").val();
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
			$scope.$digest();
		};
	}

	$scope.templates = [];
	$scope.templateName = "";

	$scope.fetchTemplates();
	setTimeout(function() {
		console.log(JSON.stringify($scope.templates));
		$scope.template = getTemplate($routeParams.name).template;
	}, 1000);
	
	console.log(JSON.stringify($scope.template));

}