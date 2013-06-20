package de.thhi.soapmock

import org.vertx.groovy.core.http.HttpServer
import org.vertx.groovy.core.http.RouteMatcher
import org.vertx.groovy.platform.Verticle

public class MockServerVerticle extends Verticle {

	def start () {

		RouteMatcher rm = new RouteMatcher()
		rm.get("/") { request ->
			container.logger.info("MockServer: received request ${request.method} ${request.uri}")
			request.response.sendFile("web/index.html")
		}
		rm.get("/test") { request ->
			container.logger.info("MockServer: received request ${request.method} ${request.uri}")
			request.response.end("Mock server running")
		}
		rm.post("/render") { request ->
			container.logger.info("MockServer: received request ${request.method} ${request.uri}")
			request.bodyHandler { body ->
				container.logger.info("MockServer: ${body}")
				vertx.eventBus.send("extractor.extract", ["source" : body.toString()]) { extractReply ->
					container.logger.info("MockServer: received ${extractReply.body}")
					vertx.eventBus.send("renderer.render", ["name" : extractReply.body.name, "binding" : extractReply.body.binding]) { renderReply ->
						container.logger.info("MockServer: received ${renderReply.body}")
						request.response.end(renderReply.body[extractReply.body.name])
					}
				}
			}
		}
		rm.getWithRegEx(".*") { request ->
			container.logger.info("MockServer: received request ${request.method} ${request.uri}")
			request.response.sendFile("web${request.uri}")
		}
		HttpServer server = vertx.createHttpServer()
		server.requestHandler(rm.asClosure())
		vertx.createSockJSServer(server).bridge(prefix: "/eventbus", [[:]], [[:]])
		server.listen(8080)

		container.logger.info("MockServerVerticle started")
	}
}