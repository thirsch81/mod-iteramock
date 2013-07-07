package thhi.vertx.iteramock

import groovy.text.SimpleTemplateEngine

import org.vertx.groovy.core.eventbus.EventBus
import org.vertx.groovy.platform.Verticle

public class ExtractorVerticle extends Verticle {

	def start() {
		readRuleFiles()
		vertx.eventBus.registerHandler("extractor.extract", handleExtract)
		vertx.eventBus.registerHandler("extractor.dispatchRule", handleDispatchRule)
		vertx.eventBus.registerHandler("extractor.extractScripts", handleExtractScripts)
		container.logger.info("ExtractorVerticle started")
	}

	def rules = {
		vertx.sharedData.getMap("extractRules")
	}

	def error(message) {
		["status": "error", "message": message]
	}

	def bindingOk(name, binding) {
		["status": "ok", "name" : name ,"binding": binding]
	}

	def fetchOk(script) {
		["status": "ok", "script": script]
	}
	def submitOk() {
		["status": "ok"]
	}

	def prepareShell(source) {
		def root = new XmlSlurper().parseText(source)
		def binding = new Binding()
		binding.setVariable("root", root)
		binding.setVariable("request", source)
		new GroovyShell(binding)
	}

	def dispatch(shell, rules) {
		shell.evaluate(rules["dispatch"])
		shell.context.getVariable("template")
	}

	def extract(shell, rules, template) {
		shell.context.variables.remove("template")
		shell.evaluate(rules[template])
		shell.context.variables.remove("root")
		shell.context.variables.remove("request")
		bindingOk(template, shell.context.variables)
	}

	def handleDispatchRule =  { message ->

		def body = message.body
		logDebug("Received ${body}")

		if(!("action" in body)) {

			replyErrorTo(message, "Expected message format: [action: <action>, (script: <script>)], not " + body)
			return
		}

		switch (body.action) {

			case "submit":

				rules()["dispatch"] = body.script
				message.reply(submitOk())
				logDebug("Accepted dispatch rule from client")
				break

			case "fetch":

				message.reply(fetchOk(rules()["dispatch"]))
				logDebug("Sent dispatch rule to client")
				break

			default:
				replyErrorTo(message, "Unknown action '" + body.action + "', expected: fetch|submit")
		}
	}

	def handleExtractScripts = { message ->

		def body = message.body
		logDebug("Received ${body}")

		if(!("action" in body)) {

			replyErrorTo(message, "Expected message format: [action: <action>, name: <name>, (script: <script>)], not " + body)
			return
		}

		switch (body.action) {

			case "submit":

				if(!("name" in body)) {

					replyErrorTo(message, "Expected message format: [action: 'submit', name: <name>, script: <script>], not " + body)
				} else {

					rules()[body.name] = body.script
					message.reply(submitOk())
					logDebug("Accepted extract script " + body.name + " from client")
				}
				break

			case "fetch":

				if(!("name" in body)) {

					replyErrorTo(message, "Expected message format: [action: 'fetch', name: <name>], not " + body)
				} else {

					message.reply(fetchOk(rules()[body.name]))
					logDebug("Sent extract script " + body.name + " to client")
				}
				break

			default:
				replyErrorTo(message, "Unknown action '" + body.action + "', expected: fetch|submit")
		}
	}

	def handleExtract = { message ->

		def body = message.body
		logDebug("Received ${body}")

		if(!("source" in body)) {

			replyErrorTo(message, "Expected message format: [source: <source>], not" + body)
			return
		}
		try {
			def rules = rules()
			def start = now()
			def shell = prepareShell(body.source)
			def p_time = now() - start
			start = now()
			def template = dispatch(shell, rules)
			def d_time = now() - start
			start = now()
			message.reply(extract(shell, rules, template))
			def e_time = now() - start
			logDebug("Parsed XML in ${p_time}ms, dispatched in ${d_time}ms and extracted binding in ${e_time}ms")
		} catch (Exception e) {

			replyErrorTo(message, e.message)
		}
	}

	def replyErrorTo(message, text) {
		logError(text)
		message.reply(error(text))
	}

	def readRuleFiles() {
		vertx.fileSystem.readDir("rules", ".*\\.groovy") { result ->
			if (result.succeeded) {
				readRulesDirectory(result.result)
			} else {
				logError("No rules directory found")
			}
		}
	}

	def readRulesDirectory(files) {
		if(files) {
			logDebug("Reading rule files...")
			for (file in files) {
				readRuleFile(file)
			}
		} else {
			logError("No rule files to read")
		}
	}

	def readRuleFile(file) {
		vertx.fileSystem.readFile(file) { result ->
			if (result.succeeded) {
				rules()[new File(file).name - ".groovy"] = result.result.toString()
				logDebug("Read rule file ${file}")
			} else {
				logError("Error reading rule ${file}", result.cause)
			}
		}
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