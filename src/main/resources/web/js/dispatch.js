function DispatchCtrl($rootScope, $scope, eventBus) {

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
};
