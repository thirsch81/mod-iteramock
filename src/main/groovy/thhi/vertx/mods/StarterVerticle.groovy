package thhi.vertx.mods

import org.vertx.groovy.platform.Verticle

public class StarterVerticle extends Verticle {

	def start() {

		container.deployModule("thhi.vertx~renderer~0.6.6") { result ->
			container.logger.info("StarterVerticle: deployed Renderer ${result.result()}")
		}
		container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
			container.logger.info("StarterVerticle: deployed Extractor ${result.result()}")
		}

		def mockServerConfig = container.config.mockserver

		container.deployVerticle("groovy:" + MockServerVerticle.class.name, mockServerConfig) { result ->
			container.logger.info("StarterVerticle: deployed MockServer ${result.result()}")
		}
	}
}
