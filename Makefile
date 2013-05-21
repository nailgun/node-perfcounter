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

.PHONY: test test-cov
