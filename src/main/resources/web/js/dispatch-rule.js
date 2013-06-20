function DispatchCtrl($scope, EventBus) {

	$scope.script = "";

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
		showMessage(reply);
		$scope.script = reply.script;
		$scope.$digest();
	};
};
