'use strict';

var PerfCounter = require('..'),
    should = require('should'),
    assert = require('assert')
    fmt = require('util').format;

describe('perfcounter', function () {
  it('should measure delay between start() and stop()', function (done) {
    var profile = perfcounter.start('Total');

    setTimeout(function () {
      profile.stop();

      var result = profile.result;
      var elapsed = result.elapsed;
      assert.ok(110 > elapsed && elapsed >= 100,
        fmt('Expect elapsed time %d to be about 100', elapsed));

      assert.ok(Math.abs(elapsed - (result.end - result.start)) < 1,
        fmt('Expect start/stop difference %d to be about total elapsed time',
          (result.end - result.start), elapsed));

      done();
    }, 100);
  });

  it('should measure delay between nested start() and stop()', function (done) {
    var profile = perfcounter.start('Total');

    setTimeout(function () {
      profile.start('Job1');
      profile.start('Job2');
      setTimeout(function () {
        profile.stop('Job1');

        profile.start('Job2/Subjob');
        setTimeout(function () {
          profile.stop('Job2/Subjob');
          profile.stop('Job2');
          profile.stop();

          var result = profile.result;
          var elapsedTotal = result.elapsed;
          var elapsed1 = result.children[0].elapsed;
          var elapsed2 = result.children[1].elapsed;
          var elapsed21 = result.children[1].children[0].elapsed;

          assert.ok(220 > elapsedTotal && elapsedTotal >= 210,
            fmt('Expect total time %d to be about 210', elapsedTotal));
          assert.ok(110 > elapsed1 && elapsed1 >= 100,
            fmt('Expect Job1 time %d to be about 100', elapsed1));
          assert.ok(120 > elapsed2 && elapsed2 >= 110,
            fmt('Expect Job2 time %d to be about 110', elapsed2));
          assert.ok(20 > elapsed21 && elapsed21 >= 10,
            fmt('Expect Job2/Subjob time %d to be about 10', elapsed21));

          done();
        }, 10);
      }, 100);
    }, 100);
  });

  it('should calculate missed coverage', function (done) {
  });

  describe('.result', function () {
    it('should contain ...');
    it('should mark interrupted measures');
    it('should return null if not stopped');
  });

  describe('.start(name, [meta])', function () {
    it("should set timer's description");
    it("should set timer's meta information");
    it('should add subtimer by name');
  });

  describe('.stop([meta])', function () {
    it("should extend timer's meta information");
  });
});
