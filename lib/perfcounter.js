'use strict';

var _ = require('lodash');

exports.start = function (msg, meta) {
  return new PerfCounter({
    msg: msg,
    meta: meta
  });
};

function PerfCounter (data) {
  this._data = data;
  data.start = Date.now();
  // High resolution support if available
  if (process && process.hrtime) {
    this.start_hr = process.hrtime();
  }

  data.stop = null;
  data.elapsed = {
    total: null,
    missed: null
  };
  this.children = [];
}

PerfCounter.prototype.stop = function (meta) {
  var data = this._data;
  if (data.stop) return;

  _.extend(data.meta, meta);
  data.stop = Date.now();

  // High resolution support if available
  if (process && process.hrtime) {
    var interval_hr = process.hrtime(this.start_hr);
    data.elapsed.total = (interval_hr[0] * 1e3) + (interval_hr[1] / 1e6);
  }
  else {
    data.elapsed.total = data.stop - data.start;
  }

  if (this.children.length) {
    data.elapsed.missed = data.elapsed.total - this.getChildrenTotal();
  }
};

Object.defineProperty(PerfCounter.prototype, 'result', {
  get: function () {
    return _.extend({}, this._data, {
      children: this.children.map(function (child) {
        return child.result;
      })
    });
  }
});

// Start nested counter
PerfCounter.prototype.start = function (msg, meta) {
  var data = this._data;

  var counter = new PerfCounter({
    msg: msg,
    meta: meta
  });

  this.children.push(counter);
  return counter;
};

PerfCounter.prototype.getChildrenTotal = function () {
  var data = this._data;

  return this.children.reduce(function (total, child) {
    return total + child._data.elapsed.total;
  }, 0);
};
