'use strict';

var _ = require('lodash');



/**
 * class PerfCounter
 *
 * Interface to collect timing data.
 **/
function PerfCounter () {
  this.data = null;
  this.current = null;
}
module.exports = PerfCounter;



/**
 * PerfCounter#start(job[, meta={}])
 * - job (String):  Job name that will be started.
 * - meta (Object): Additional meta information.
 *
 * Starts counter.
 *
 * ### Example
 * ```javascript
 * var profile = new PerfCounter;
 * profile.start('Total');
 * profile.start('Job1', {count: count});
 * profile.start('Subjob');
 * ```
 **/
PerfCounter.prototype.start = function (job, meta) {
  var data = {
    job: job,
    meta: meta,
    start: Date.now(),
    children: []
  };

  // High resolution support if available
  if (process && process.hrtime) {
    data.start_hr = process.hrtime();
  }

  if (this.current) {
    this.current.children.push(data);
    data.parent = this.current;
  }
  else {
    this.data = data;
  }

  this.current = data;
};



/**
 * PerfCounter#stop(job[, meta={}])
 * - job (String):  Job name to stop. Should be latest started job.
 * - meta (Object): Additional meta information to be added to an existing one.
 *
 * ### Example
 * ```javascript
 * var profile = new PerfCounter;
 * profile.start('Total');
 * profile.start('Job1');
 * profile.start('Subjob');
 * profile.stop('Subjob');
 * profile.stop('Job1', {count: count});
 * profile.stop('Total');
 * ```
 **/
PerfCounter.prototype.stop = function (job, meta) {
  var data = this.current;

  if (!data) {
    throw new Error('PerfCounter: .stop("'+job+'") is called, but there is no current job');
  }
  if (data.job != job) {
    throw new Error('PerfCounter: .stop("'+job+'") is called, but current job is "'+data.job+'"');
  }

  _.extend(data.meta, meta);

  data.end = Date.now();

  // High resolution support if available
  if (process && process.hrtime) {
    var interval_hr = process.hrtime(data.start_hr);
    data.total = (interval_hr[0] * 1e3) + (interval_hr[1] / 1e6);
    delete data.start_hr;
  }
  else {
    data.total = data.end - data.start;
  }

  if (_.keys(data.children).length) {
    data.missed = data.total - _.reduce(data.children, function (total, child) {
      return total + child.total;
    }, 0);
  }

  this.current = data.parent;
};



/**
 * PerfCounter#stopped -> Boolean
 *
 * Returns true if counter is not running now.
 **/
Object.defineProperty(PerfCounter.prototype, 'stopped', {
  get: function () {
    return !this.current
  }
});



/**
 * PerfCounter#data -> Object
 *
 * Contains timing results.
 **/
