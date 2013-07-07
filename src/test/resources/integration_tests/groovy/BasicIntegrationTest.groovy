import static org.vertx.testtools.VertxAssert.*

import org.vertx.groovy.core.http.HttpClientResponse
import org.vertx.groovy.testtools.VertxTests

import thhi.vertx.iteramock.ExtractorVerticle
import thhi.vertx.iteramock.MockServerVerticle
import thhi.vertx.iteramock.StarterVerticle

// The test methods must being with "test"

def testHTTP() {
	container.deployVerticle("groovy:" + StarterVerticle.class.name) { result ->
		assertNotNull(result)
		assertTrue("${result.cause()}", result.succeeded)
		vertx.createHttpClient().setHost("localhost").setPort(8080).getNow("/test") { HttpClientResponse resp ->
			assertEquals(200, resp.statusCode)
			resp.bodyHandler {
				container.logger.info(it)
				assertTrue(it.toString().contains("Mock server running"))
				testComplete()
			}
		}
	}
}

def testDeployMockServerVerticle() {
	container.deployVerticle("groovy:" + MockServerVerticle.class.name) { result ->
		assertTrue("${result.cause()}", result.succeeded)
		testComplete()
	}
}

def testDeployExtractorVerticle() {
	container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
		assertTrue("${result.cause()}", result.succeeded)
		testComplete()
	}
}

def testExtractorVerticleExtract() {
	container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
		assertTrue("${result.cause()}", result.succeeded)
		vertx.eventBus.send("extractor.extract", ["source" : '<?xml version="1.0" encoding="UTF-8" ?><root><test>some content</test></root>']) { reply ->
			assertNotNull(reply)
			container.logger.info(reply.body)
			reply.body.with {
				assertEquals("ok",it.status )
				assertNotNull(it.binding)
				assertEquals(["content": "some content"], it.binding)
			}
			testComplete()
		}
	}
}

def testExtractorVerticleFetchDispatchRule() {
	container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
		assertTrue("${result.cause()}", result.succeeded)
		vertx.eventBus.send("extractor.dispatchRule", ["action" : "fetch"]) { reply ->
			assertNotNull(reply)
			container.logger.info(reply.body)
			reply.body.with {
				assertEquals("ok",it.status )
				assertNotNull(it.script)
				assertEquals(new File("rules/dispatch.groovy").text, it.script)
			}
			testComplete()
		}
	}
}

def testExtractorVerticleSubmitDispatchRule() {
	container.deployWorkerVerticle("groovy:" + ExtractorVerticle.class.name) { result ->
		assertTrue("${result.cause()}", result.succeeded)
		Thread.sleep(3000); // Hacky, wait for async file reading...
		vertx.eventBus.send("extractor.dispatchRule", ["action" : "submit", "script": /template = "response"/]) { submitReply ->
			assertNotNull(submitReply)
			container.logger.info(submitReply.body)
			assertEquals("ok",submitReply.body.status )
			vertx.eventBus.send("extractor.dispatchRule", ["action" : "fetch"]) { fetchReply ->
				assertNotNull(fetchReply)
				container.logger.info(fetchReply.body)
				fetchReply.body.with {
					assertEquals("ok",it.status )
					assertNotNull(it.script)
					assertEquals(/template = "response"/, it.script)
				}
				testComplete()
			}
		}
	}
}

VertxTests.initialize(this)
VertxTests.startTests(this)