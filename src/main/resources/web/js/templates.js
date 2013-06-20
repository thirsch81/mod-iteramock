function TemplateCtrl($scope, EventBus) {

	$scope.templates = [];
	$scope.templateName = "";

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
		EventBus.send("renderer.templates", {
			action : "fetch"
		}, updateTemplates);
	}

	$scope.deleteTemplate = function() {
		angular.forEach($scope.templates, function(value, key) {
			if (value.name == activeTemplate()) {
				$scope.templates.splice(key, 1);
			};
		});
	}

	$scope.submit = function() {
		EventBus.send("renderer.templates", {
			"action" : "submit",
			"name" : activeTemplate(),
			"template" : activeTemplateContent()
		}, showMessage);
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
		showMessage(reply);
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
}