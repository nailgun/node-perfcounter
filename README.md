PerfCounter
===========

*Inspired by [nodeca/puncher](https://github.com/nodeca/puncher)*

Library to collect timing data for your node.js application. Simplifies bottlenecks search.

Usage
-----

``` javascript
var perfcounter = require('perfcounter'),
    profile = perfcounter.start();

function doSomeJob (callback) {
  profile.start('doSomeJob');

  profile.start('doSomeJob/Timeout 1');
  setTimeout(function () {
    profile.stop('doSomeJob/Timeout 1');

    profile.start('doSomeJob/Timeout 2');
    setTimeout(function () {
      profile.stop('doSomeJob/Timeout 2');

      profile.start('doSomeJob/Timeout 3');
      setTimeout(function () {
        profile.stop('doSomeJob/Timeout 3');

        profile.stop('doSomeJob');
        callback && callback();
      }, 300);
    }, 200);
  }, 100);
}

doSomeJob(function () {
  profile.stop();
  console.log(require('util').inspect(profile.result, false, 10, true));
});
```

Example above will show you something like this:

``` javascript
{ name: 'Total',
  meta: {},
  start: 1369158511247,
  end: 1369158511853,
  total: 605.88982,
  missed: 0.5713479999999436,
  children: 
   [ { name: 'doSomeJob',
       meta: {},
       start: 1369158511247,
       end: 1369158511853,
       total: 605.318472,
       missed: 0.7340830000000551,
       children: 
        [ { name: 'Timeout 1',
            meta: {},
            start: 1369158511247,
            end: 1369158511350,
            total: 102.898981,
            missed: null,
            children: [] },
          { name: 'Timeout 2',
            meta: {},
            start: 1369158511351,
            end: 1369158511551,
            total: 200.483068,
            missed: null,
            children: [] },
          { name: 'Timeout 3',
            meta: {},
            start: 1369158511551,
            end: 1369158511853,
            total: 301.20234,
            missed: null,
            children: [] } ] } ] }
```
