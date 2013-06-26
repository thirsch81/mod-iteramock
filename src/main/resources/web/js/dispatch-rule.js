function DispatchCtrl($scope, EventBus) {

	$scope.dispatchEditorOptions = {
		theme : "blackboard",
		mode : "text/x-groovy",
		lineNumbers : true,
		matchBrackets : true,
		value: "// Enter script"
	}
	
	$scope.submit = function() {
		EventBus.send("extractor.dispatchRule", {
			action : "submit",
			script : $scope.script
		}, showMessage);
	};

	$scope.fetch = function() {
		EventBus.send("extractor.dispatchRule", {
			action : "fetch"
		}, updateScript);
	};

	function updateScript(reply) {
		$scope.script = reply.script;
		$scope.$digest();
	};
};