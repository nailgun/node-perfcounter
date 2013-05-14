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

```
