MOCHA_OPTS=
REPORTER = spec

test:
	./node_modules/.bin/mocha test \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS) \
		$(OUTPUT)

test-cov:
	rm -rf lib-cov
	jscoverage lib lib-cov
	mkdir -p test/out
	MYFILES_COV=1 $(MAKE) -s test REPORTER=html-cov > test/out/coverage.html
	rm -rf lib-cov

doc:
	./node_modules/.bin/ndoc --index README.md lib

lint:
	jshint --show-non-errors lib

.PHONY: test test-cov doc lint
