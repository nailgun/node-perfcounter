'use strict';

var _ = require('lodash');

/**
 * start(name[, meta={}]) -> PerfCounter
 * - name (String): Descriptive name of the counter.
 * - meta (Object): Additional meta information.
 *
 * Starts a new root counter.
 *
 * ### Example
 * ```javascript
 * var profile = require('perfcounter').start('Total', {count: count});
 * ```
 **/
exports.start = function (name, meta) {
  return new PerfCounter({
    name: name,
    meta: _.extend({}, meta)
  });
};

/**
 * class PerfCounter
 *
 * Interface to collect timing data.
 **/
function PerfCounter (data) {
  this._data = data;
  data.start = Date.now();
  // High resolution support if available
  if (process && process.hrtime) {
    this.start_hr = process.hrtime();
  }

  data.end = null;
  data.total = null;
  data.missed = null;
  this.children = {};
  this.result = null;
}

/**
 * PerfCounter#stop([path[, meta={}]])
 * - path (String): Slash-separated path to a nested counter. Can be null.
 * - meta (Object): Additional meta information to be added to an existing one.
 *
 * If *path* is null or undefined stop this counter. Otherwise stop a nested
 * counter by it's relative path. Counter's path is the names of it's parent
 * counters and it's own name separated by slash.
 *
 * When counter is stopped all nested running counters are interrupted.
 * Interruption is the same as stopping but it also sets interrupted flag in
 * result.
 *
 * After stopping a counter PerfCounter#result becomes available.
 *
 * ### Example
 * ```javascript
 * var profile = require('perfcounter').start('Total');
 * profile.start('Job1');
 * profile.start('Job1/Subjob');
 * profile.stop('Job1', {count: count});
 * profile.stop();
 * ```
 **/
PerfCounter.prototype.stop = function (path, meta) {
  if (path) {
    var names = path.split('/');

    var counter = this;
    _.forEach(names, function (name) {
      counter = counter.children[name];
      if (!counter) {
        return true;
      }
    });

    if (counter) {
      counter.stop(null, meta);
    }
    return;
  }

  var data = this._data;
  if (this.stopped) return;

  _.forEach(this.children, function (child) {
    if (!child.stopped) {
      child._data.interrupted = true;
      child.stop();
    }
  });

  _.extend(data.meta, meta);
  data.end = Date.now();

  // High resolution support if available
  if (process && process.hrtime) {
    var interval_hr = process.hrtime(this.start_hr);
    data.total = (interval_hr[0] * 1e3) + (interval_hr[1] / 1e6);
  }
  else {
    data.total = data.end - data.start;
  }

  if (_.keys(this.children).length) {
    data.missed = data.total - this.getChildrenTotal();
  }

  this.result = _.extend({}, data, {
    children: _.map(this.children, function (child) {
      return child.result;
    })
  });
};

/**
 * PerfCounter#stopped -> Boolean
 *
 * Returns true if PerfCounter#stop() was called.
 **/
Object.defineProperty(PerfCounter.prototype, 'stopped', {
  get: function () {
    return !!this._data.end;
  }
});


/**
 * PerfCounter#start(path[, meta={}]) -> PerfCounter
 * - path (String): Slash-separated path of the nested counter.
 * - meta (Object): Additional meta information.
 *
 * Starts nested counter. Returns nested counter.
 *
 * ### Example
 * ```javascript
 * var profile = require('perfcounter').start('Total');
 * profile.start('Job1', {count: count});
 * profile.start('Job1/Subjob');
 * ```
 **/
PerfCounter.prototype.start = function (path, meta) {
  var names = path.split('/');

  var counter = this;
  _.forEach(names, function (name) {
    var next = counter.children[name];
    if (!next) {
      next = new PerfCounter({
        name: name,
        meta: {}
      });
      counter.children[name] = next;
    }
    counter = next;
  });

  _.extend(counter._data.meta, meta);
  return counter;
};

PerfCounter.prototype.getChildrenTotal = function () {
  return _.reduce(this.children, function (total, child) {
    return total + child._data.total;
  }, 0);
};

/**
 * PerfCounter#result -> Object
 *
 * Is null if the counter is running. Otherwise it contains timing results.
 **/
