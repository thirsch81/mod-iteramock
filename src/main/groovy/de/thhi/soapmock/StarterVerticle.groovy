package de.thhi.soapmock

import org.vertx.groovy.platform.Verticle

public class StarterVerticle extends Verticle {

	def start() {

		container.deployModule("thhi.vertx~renderer~0.5.0") { result ->
			container.logger.info("StarterVerticle: deployed Renderer ${result.result()}")
		}
		container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
			container.logger.info("StarterVerticle: deployed Extractor ${result.result()}")
		}
		container.deployVerticle("groovy:" + MockServerVerticle.class.name) { result ->
			container.logger.info("StarterVerticle: deployed MockServer ${result.result()}")
		}
	}
}
