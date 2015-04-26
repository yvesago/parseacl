
'use strict';

var dns = require('dns'),
    ip = process.argv[2];//,
//    debug = require('debug')('dns-sync');

dns.reverse(ip, function (err, hosts) {
    if (err) {
        process.exit(1);
        //console.log(err);
    } else {
        //debug(name, 'resolved to', hosts);
        process.stdout.write(hosts[0]);
    }
});
