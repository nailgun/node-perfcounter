'use strict';

var perfcounter = require('..'),
    should = require('should'),
    assert = require('assert'),
    fmt = require('util').format;

describe('perfcounter', function () {
  it('should measure delay between start() and stop()', function (done) {
    var profile = perfcounter.start('Total');

    setTimeout(function () {
      profile.stop();

      var result = profile.result;
      var total = result.total;
      assert.ok(120 > total && total >= 100,
        fmt('Expect total time %d to be about 100', total));

      assert.ok(Math.abs(total - (result.end - result.start)) < 1,
        fmt('Expect start/stop difference %d to be about total time',
          (result.end - result.start), total));

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
          var total = result.total;
          var elapsed1 = result.children[0].total;
          var elapsed2 = result.children[1].total;
          var elapsed21 = result.children[1].children[0].total;

          assert.ok(230 > total && total >= 210,
            fmt('Expect total time %d to be about 210', total));
          assert.ok(120 > elapsed1 && elapsed1 >= 100,
            fmt('Expect Job1 time %d to be about 100', elapsed1));
          assert.ok(130 > elapsed2 && elapsed2 >= 110,
            fmt('Expect Job2 time %d to be about 110', elapsed2));
          assert.ok(30 > elapsed21 && elapsed21 >= 10,
            fmt('Expect Job2/Subjob time %d to be about 10', elapsed21));

          done();
        }, 10);
      }, 100);
    }, 100);
  });

  it('should calculate missed coverage', function (done) {
    var profile = perfcounter.start('Total');

    setTimeout(function () {
      profile.start('Job');
      setTimeout(function () {
        profile.stop('Job');
        profile.stop();

        var result = profile.result;
        var missed = result.missed;
        assert.ok(120 > missed && missed >= 100,
          fmt('Expect missed time %d to be about 100', missed));

        done();
      }, 100);
    }, 100);
  });

  it('should mark interrupted measures', function () {
    var profile = perfcounter.start('Total');
    profile.start('Job1');
    profile.start('Job2');
    profile.stop();

    var result = profile.result;
    result.children[0].interrupted.should.be.true;
    result.children[1].interrupted.should.be.true;
  });

  describe('.result', function () {
    it('should contain null if not stopped', function () {
      var profile = perfcounter.start('Total');
      should.not.exist(profile.result);
    });
  });

  describe('.start(name, [meta])', function () {
    it("should set timer's name", function () {
      var profile = perfcounter.start('Total');
      profile.start('Job1');
      profile.stop();

      var result = profile.result;
      result.name.should.equal('Total');
      result.children[0].name.should.equal('Job1');
    });

    it("should set timer's meta information", function () {
      var meta1 = {
        data: 123
      };
      var meta2 = {
        data: 1234
      };

      var profile = perfcounter.start('Total', meta1);
      profile.start('Job1', meta2);
      profile.stop();

      var result = profile.result;
      result.meta.should.eql(meta1);
      result.children[0].meta.should.eql(meta2);
    });
  });

  describe('.stop([meta])', function () {
    it("should extend timer's meta information", function () {
      var meta1 = {
        data: 123
      };
      var meta2 = {
        data: 1234
      };
      var meta1e = {
        data2: 123
      };
      var meta2e = {
        data2: 1234
      };

      var profile = perfcounter.start('Total', meta1);
      profile.start('Job1', meta2);
      profile.stop('Job1', meta2e);
      profile.stop(null, meta1e);

      var result = profile.result;
      result.meta.should.eql({
        data: 123,
        data2: 123
      });
      result.children[0].meta.should.eql({
        data: 1234,
        data2: 1234
      });
    });
  });
});
