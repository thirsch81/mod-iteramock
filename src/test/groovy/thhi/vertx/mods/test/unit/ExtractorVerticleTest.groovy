package thhi.vertx.mods.test.unit;

import static org.junit.Assert.*;

import thhi.vertx.mods.ExtractorVerticle
import org.junit.Test;
import org.vertx.groovy.core.Vertx

class ExtractorVerticleTest {

	@Test
	public void testPrepareShell() {
		def vert = new ExtractorVerticle()
		def shell = vert.prepareShell('<?xml version="1.0" encoding="UTF-8" ?><root><test>some content</test></root>')
		assertEquals("some content", shell.context.variables.root.test.text())
		assertEquals('<?xml version="1.0" encoding="UTF-8" ?><root><test>some content</test></root>', shell.context.variables.request)
	}


	@Test
	public void testNamespace() {
		def vert = new ExtractorVerticle()
		def shell = vert.prepareShell("""<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:req="http://b2c.otto.de/schema/customer/request" xmlns:req1="http://b2c.otto.de/schema/common/request" xmlns:com="http://b2c.otto.de/schema/common">
   <soapenv:Header/>
   <soapenv:Body>123</soapenv:Body>
</soapenv:Envelope>""")
		assertEquals("123", shell.context.variables.root."soapenv:Body".text())
	}

	@Test
	public void testDispatch() {
		def rules = [:]
		rules.put("dispatch", """if(root.test.text() == "some content") {
	template = "test-response"
}"""
				)
		def extractor = new ExtractorVerticle()
		extractor.rules = { rules }
		def shell = extractor.prepareShell('<?xml version="1.0" encoding="UTF-8" ?><root><test>some content</test></root>')
		extractor.dispatch(shell, rules)
		assertEquals("test-response", shell.context.variables.template)
	}

	@Test
	public void testExtract() {
		def rules = [:]
		rules.put("test-response", "content = root.test.text()")
		def extractor = new ExtractorVerticle()
		extractor.rules = { rules }
		def shell = extractor.prepareShell('<?xml version="1.0" encoding="UTF-8" ?><root><test>some content</test></root>')
		def result = extractor.extract(shell, rules, "test-response")
		assertEquals(["status": "ok", "name": "test-response" ,"binding": ["content": "some content"]], result)
		assertNull(shell.context.variables.template)
		assertNull(shell.context.variables.request)
		assertNull(shell.context.variables.root)
		assertEquals("some content", shell.context.variables.content)
	}
}
