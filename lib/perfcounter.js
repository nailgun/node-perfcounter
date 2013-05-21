'use strict';

var _ = require('lodash');

exports.start = function (name, meta) {
  return new PerfCounter({
    name: name,
    meta: _.extend({}, meta)
  });
};

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

  _.forEach(this.children, function (child) {
    if (!child.stopped) {
      child._data.interrupted = true;
      child.stop();
    }
  });

  if (_.keys(this.children).length) {
    data.missed = data.total - this.getChildrenTotal();
  }

  this.result = _.extend({}, data, {
    children: _.map(this.children, function (child) {
      return child.result;
    })
  });
};

Object.defineProperty(PerfCounter.prototype, 'stopped', {
  get: function () {
    return !!this._data.end;
  }
});

// Start nested counter
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
  var data = this._data;

  return _.reduce(this.children, function (total, child) {
    return total + child._data.total;
  }, 0);
};
