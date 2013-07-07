package thhi.vertx.iteramock

import org.vertx.groovy.core.http.HttpServer
import org.vertx.groovy.core.http.RouteMatcher
import org.vertx.groovy.platform.Verticle

public class MockServerVerticle extends Verticle {

	def start () {

		createServer("localhost", 8080)
	}


	def createServer(hostname, port) {
		RouteMatcher rm = new RouteMatcher()

		rm.get("/") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.response.sendFile("web/index.html")
		}

		rm.get("/test") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.response.end("Mock server running")
		}

		rm.post("/render") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.bodyHandler { body ->
				sendToExtractor(body.toString()) { extractReply ->
					if(!("ok" == extractReply.status)) {
						request.response.end(extractReply.body)
					} else {
						logDebug("Received ${extractReply.body}")
						sendToRenderer(extractReply.body.name,extractReply.body.binding) { renderReply ->
							if(!("ok" == renderReply.status)) {
								request.response.end(renderReply.body)
							} else {
								logDebug("Received ${renderReply.body}")
								request.response.end(renderReply.body[extractReply.body.name])
							}
						}
					}
				}
			}
		}

		rm.getWithRegEx(".*") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.response.sendFile("web${request.uri}")
		}

		HttpServer server = vertx.createHttpServer()
		server.requestHandler(rm.asClosure())
		// TODO Security hole
		vertx.createSockJSServer(server).bridge(prefix: "/eventbus", [[:]], [[:]])
		server.listen(port, hostname)
	}

	def sendToExtractor(source, replyHandler) {
		vertx.eventBus.send("extractor.extract", ["source" : source], replyHandler)
	}

	def sendToRenderer(name, binding, replyHandler) {
		vertx.eventBus.send("renderer.render", ["name" : name, "binding" : binding], replyHandler)
	}

	def logInfo(msg, err = null) {
		if(container.logger.infoEnabled) {
			container.logger.info(msg, err)
		}
	}

	def logError(msg, err = null) {
		container.logger.error(msg, err)
	}

	def logDebug(msg, err = null) {
		if(container.logger.debugEnabled) {
			container.logger.debug(msg, err)
		}
	}

	def now = { System.currentTimeMillis() }
}