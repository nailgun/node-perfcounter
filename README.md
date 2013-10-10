PerfCounter
===========

[![Build Status](https://travis-ci.org/nailgun/node-perfcounter.png?branch=master)](https://travis-ci.org/nailgun/node-perfcounter)

Library to collect timing data for your node.js application. Simplifies bottlenecks search.

Usage
-----

``` javascript
var PerfCounter = require('perfcounter'),
    profile = new PerfCounter;

profile.start('Total');
function doSomeJob (callback) {
  profile.start('doSomeJob');

  profile.start('Timeout 1');
  setTimeout(function () {
    profile.stop('Timeout 1');

    profile.start('Timeout 2');
    setTimeout(function () {
      profile.stop('Timeout 2');

      profile.start('Timeout 3');
      setTimeout(function () {
        profile.stop('Timeout 3');

        profile.stop('doSomeJob');
        callback && callback();
      }, 300);
    }, 200);
  }, 100);
}

doSomeJob(function () {
  profile.stop('Total');
  console.log(require('util').inspect(profile.data, false, 10, true));
});
```

Example above will show you something like this:

``` javascript
{ job: 'Total',
  meta: undefined,
  start: 1381415978874,
  children: 
   [ { job: 'doSomeJob',
       meta: undefined,
       start: 1381415978874,
       children: 
        [ { job: 'Timeout 1',
            meta: undefined,
            start: 1381415978874,
            children: [],
            parent: [Circular],
            end: 1381415978978,
            total: 103.757099 },
          { job: 'Timeout 2',
            meta: undefined,
            start: 1381415978978,
            children: [],
            parent: [Circular],
            end: 1381415979178,
            total: 200.49963 },
          { job: 'Timeout 3',
            meta: undefined,
            start: 1381415979178,
            children: [],
            parent: [Circular],
            end: 1381415979480,
            total: 301.456445 } ],
       parent: [Circular],
       end: 1381415979480,
       total: 605.928503,
       missed: 0.215328999999997 } ],
  end: 1381415979480,
  total: 606.061363,
  missed: 0.1328600000000506 }
```
