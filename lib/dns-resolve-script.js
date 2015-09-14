// nodejs ./dns-resolve-script.js IPv4 [timeout]

'use strict';

var dns = require('dns'),
    ip = process.argv[2],
    dnsTimeout = process.argv[3] || 10;

var reverseIp = function(ip, timeout, callback) {
  var callbackCalled = false;
  var doCallback = function(err, ips) {
    if (callbackCalled) return;
    callbackCalled = true;
    callback(err, ips);
  };

  setTimeout(function() {
    doCallback(new Error("Timeout exceeded"), null);
  }, timeout);

  dns.reverse(ip, doCallback);
};

reverseIp(ip, dnsTimeout , function(err, hosts) {
 //       console.log('+' + dnsTimeout + '+');
  if (err) {
    process.exit(1);
    return;
  }
  process.stdout.write(hosts[0]);
});
