'use strict';

var PerfCounter = require('..'),
    should = require('should'),
    assert = require('assert'),
    async = require('async'),
    fmt = require('util').format;

describe('PerfCounter', function () {
  it('should measure delay between start() and stop()', function (done) {
    var profile = new PerfCounter;
    profile.start('Total');

    setTimeout(function () {
      profile.stop('Total');

      var data = profile.data;
      var total = data.total;
      assert.ok(120 > total && total >= 90,
        fmt('Expect total time %d to be about 100', total));

      assert.ok(Math.abs(total - (data.end - data.start)) < 1,
        fmt('Expect start/stop difference %d to be about total time',
          (data.end - data.start), total));

      done();
    }, 100);
  });

  it('should measure delay between nested start() and stop()', function (done) {
    var profile = new PerfCounter;
    profile.start('Total');

    setTimeout(function () {

      profile.start('Job1');
      setTimeout(function () {
        profile.stop('Job1');

        profile.start('Job2');
        profile.start('Subjob');
        setTimeout(function () {
          profile.stop('Subjob');
          profile.stop('Job2');

          profile.stop('Total');

          var data = profile.data;
          var total = data.total;
          var elapsed1 = data.children[0].total;
          var elapsed2 = data.children[1].total;
          var elapsed21 = data.children[1].children[0].total;

          assert.ok(230 > total && total >= 200,
            fmt('Expect total time %d to be about 210', total));
          assert.ok(120 > elapsed1 && elapsed1 >= 90,
            fmt('Expect Job1 time %d to be about 100', elapsed1));
          assert.ok(30 > elapsed2 && elapsed2 >= 0,
            fmt('Expect Job2 time %d to be about 10', elapsed2));
          assert.ok(30 > elapsed21 && elapsed21 >= 0,
            fmt('Expect Job2/Subjob time %d to be about 10', elapsed21));

          done();
        }, 10);
      }, 100);
    }, 100);
  });

  it('should calculate missed coverage', function (done) {
    var profile = new PerfCounter;
    profile.start('Total');

    setTimeout(function () {

      profile.start('Job');
      setTimeout(function () {
        profile.stop('Job');

        profile.stop('Total');

        var data = profile.data;
        var missed = data.missed;
        assert.ok(120 > missed && missed >= 90,
          fmt('Expect missed time %d to be about 100', missed));

        done();
      }, 100);
    }, 100);
  });

  describe('.data', function () {
    it('should be null when PerfCounter created', function () {
      var profile = new PerfCounter;
      should.not.exist(profile.data);
    });
  });

  describe('.stopped', function () {
    it('should be true when PerfCounter created', function () {
      var profile = new PerfCounter;
      profile.stopped.should.be.true;
    });

    it('should be false after .start()', function () {
      var profile = new PerfCounter;
      profile.start('Total');
      profile.stopped.should.be.false;
    });

    it('should be true after all jobs are stopped', function () {
      var profile = new PerfCounter;
      profile.start('Total');
      profile.stop('Total');
      profile.stopped.should.be.true;
    });
  });

  describe('.start(job, [meta])', function () {
    it("should set timer's job", function () {
      var profile = new PerfCounter;
      profile.start('Total');
      profile.start('Job1');
      profile.stop('Job1');
      profile.stop('Total');

      var data = profile.data;
      data.job.should.equal('Total');
      data.children[0].job.should.equal('Job1');
    });

    it("should set timer's meta information", function () {
      var meta1 = {
        data: 123
      };
      var meta2 = {
        data: 1234
      };

      var profile = new PerfCounter;
      profile.start('Total', meta1);
      profile.start('Job1', meta2);
      profile.stop('Job1');
      profile.stop('Total');

      var data = profile.data;
      data.meta.should.eql(meta1);
      data.children[0].meta.should.eql(meta2);
    });
  });

  describe('.stop(job, [meta])', function () {
    it('should throw if called with unmatching job', function () {
      var profile = new PerfCounter;
      profile.start('Total');
      profile.start('Job1');

      (function () {
        profile.stop('Total');
      }).should.throw;
    });

    it("should extend timer's meta information", function () {
      var meta1 = {
        data1: 'd11',
        data2: 'd12'
      };
      var meta2 = {
        data1: 'd21',
        data2: 'd22'
      };
      var meta1e = {
        data2: 'd13',
        data3: 'd14'
      };
      var meta2e = {
        data2: 'd23',
        data3: 'd24'
      };

      var profile = new PerfCounter;
      profile.start('Total', meta1);
      profile.start('Job1', meta2);
      profile.stop('Job1', meta2e);
      profile.stop('Total', meta1e);

      var data = profile.data;
      data.meta.should.eql({
        data1: 'd11',
        data2: 'd13',
        data3: 'd14'
      });
      data.children[0].meta.should.eql({
        data1: 'd21',
        data2: 'd23',
        data3: 'd24'
      });
    });
  });

  describe('.parallel()', function () {
    it('should create subcounter that runs in parallel with other parallel subcounters', function (done) {
      var profile = new PerfCounter;
      profile.start('Total');

      async.times(10, function (n, cb) {
        var sub = profile.parallel();
        sub.start('Job1');
        setTimeout(function () {
          sub.stop('Job1');


          if (n % 2) {
            cb();
          }
          else {
            sub.start('Job2');
            setTimeout(function () {
              sub.stop('Job2');
              cb();
            }, 10);
          }
        }, 50);
      },
      function () {
        profile.stop('Total');

        var data = profile.data;
        data.total.should.be.within(50, 80);

        data.children[0].parallel.should.have.length(10);
        data.children[0].total.should.be.within(40, 70);
        data.children[0].average.should.be.within(40, 70);

        data.children[1].parallel.should.have.length(5);
        data.children[1].total.should.be.within(0, 20);
        data.children[1].average.should.be.within(0, 20);

        done();
      });
    });

    it('should throw if counter is not running', function () {
      var profile = new PerfCounter;
      (function () {
        profile.parallel();
      }).should.throw;
    });
  });
});
