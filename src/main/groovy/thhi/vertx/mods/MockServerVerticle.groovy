package thhi.vertx.mods

import org.vertx.groovy.core.http.HttpServer
import org.vertx.groovy.core.http.RouteMatcher
import org.vertx.groovy.platform.Verticle

public class MockServerVerticle extends Verticle {

	def start () {

		def hostname = container.config.hostname
		def webPort = container.config.webPort as int
		def servicePath = container.config.servicePath
		def servicePort = container.config.servicePort as int

		vertx.eventBus.registerHandler("mockserver.settings", handleSettings)

		createFrontendServer(hostname, webPort)
		createMockServer(hostname, servicePort, servicePath)
	}

	def settings = {
		vertx.sharedData.getMap("mockserver.settings")
	}

	def fetchOk(settings) {
		["status": "ok", "settings": settings]
	}

	def submitOk() {
		["status": "ok"]
	}

	def createFrontendServer(hostname, port) {
		RouteMatcher rm = new RouteMatcher()

		rm.get("/") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.response.sendFile("web/index.html")
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

	def createMockServer(hostname, port, path) {
		RouteMatcher rm = new RouteMatcher()

		rm.get("/test") { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.response.end("Mock server running")
		}

		rm.post("/"  + path) { request ->
			logDebug("Received request ${request.method} ${request.uri}")
			request.bodyHandler { body ->
				handleMockRequest(body, request)
			}
		}

		HttpServer server = vertx.createHttpServer()
		server.requestHandler(rm.asClosure())
		server.listen(port, hostname)
	}

	def handleMockRequest(body, request) {
		sendToExtractor(body.toString()) { extractReply ->
			if(!("ok" == extractReply.body.status)) {
				logError(extractReply.body as String)
				request.response.end(extractReply.body as String)
			} else {
				logDebug("Received ${extractReply.body}")
				sendToRenderer(extractReply.body.name, extractReply.body.binding) { renderReply ->
					if(!("ok" == renderReply.body.status)) {
						request.response.end(renderReply.body.message)
					} else {
						logDebug("Received ${renderReply.body}")
						request.response.end(renderReply.body[extractReply.body.name])
					}
				}
			}
		}
	}


	def handleSettings = { message ->

		def body = message.body
		logDebug("Received ${body}")

		if(!("action" in body)) {

			replyErrorTo(message, "Expected message format: [action: <action>, (settings: <settings>)], not " + body)
			return
		}

		switch (body.action) {

			case "submit":

				settings().with { it = body.settings }
				message.reply(submitOk())
				logDebug("Accepted setttings from client")
				break
			case "fetch":

				message.reply(fetchOk(settings()))
				logDebug("Sent settings to client")
				break

				break
			default:
				replyErrorTo(message, "Unknown action '" + body.action + "', expected: fetch|submit")
		}
	}

	def sendToExtractor(source, replyHandler) {
		vertx.eventBus.send("extractor.extract", ["source" : source], replyHandler)
	}

	def sendToRenderer(name, binding, replyHandler) {
		vertx.eventBus.send("renderer.render", ["name" : name, "binding" : binding], replyHandler)
	}

	def replyErrorTo(message, text) {
		logError(text)
		message.reply(error(text))
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