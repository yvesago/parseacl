/***

Read ACL from file

$ npm install stdio
$ npm install underscore

ex:

$ node read.js --file test.acl --config ./config [-v] [-d]

***/

var fs = require('fs');
var path = require('path');

var _ = require("underscore")._;

var Vlan = require('parseacl');

var stdio = require('stdio');
var ops = stdio.getopt({
    'file': {args: 1, mandatory: true},
    'config': {args: 1, description: 'Optionnal config file module ex: ./config '},
    'viewline': {key: 'v', description: 'View acls lines'},
    'dns': {key: 'd', description: 'Reverse DNS for IP'}
});

console.log('File : ' + ops.file);
var viewLine = ops.viewline ;
var dns = ops.dns;
var config, configfile = ops.config;

if (configfile) config = require(configfile);

var filePath = path.join(__dirname, ops.file);

fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (err){  console.log(err); return false; };

    data = data.split("\n");
    //    console.log(typeof(data));
    var v = new Vlan(config);
    v.Parse(data);

//console.log(JSON.stringify(v, null, 2));

    console.log('===================================');
    console.log(v.name);
    console.log('Desc : ' + v.desc);

    console.log('--');
    console.log('Full Access');
    _.each(v.fullnet,function(d) {
        console.log('   ' + d.line );
        if (d.com) console.log('    -> ' + d.com );
    });

    console.log('--');
    console.log('Int networks');
    v.intNetworks.forEach(function(d) {
        console.log('   ' + d.type() + ' ' + d.net );
    });

    console.log('SubNet Int');
    _.each(v.intSubNet,function(d) {
        console.log('   ' + d.type() + ' ' + d.net );
            if (viewLine) _.each(d.line, function(l) {console.log('    + ' + l) });
            _.each(d.inMachine, function(m) {
                console.log('    m - '  + m.type() + ' ' + ((dns)?m.name()+' ('+m.ip()+')':m.ip()) ); 
                if (viewLine) _.each(m.line, function(l) {console.log('    + ' + l) });
            });
    });

    console.log('Mach Int');
    _.each(_(v.intMachines).sortBy('_ip'), function(d) {
        console.log('   ' + d.type() + ' ' + ((dns)?d.name()+' ('+d.ip()+')':d.ip()) );
            if (viewLine) _.each(d.line, function(l) {console.log('    + ' + l) });
    });

    console.log('--');
    console.log('Net Ext');
    _.each(_(v.extNet).sortBy('net'), function(d) {
        console.log('   ' + d.net );
          if (viewLine) _.each(d.line, function(l) {console.log('    + ' + l) });
    });

    console.log('SubNet Ext');
    _.each(v.extSubNet,function(d) {
        console.log('   ' + d.type() + ' ' + d.net );
            if (viewLine) _.each(d.line, function(l) {console.log('    + ' + l) });
            _.each(d.inMachine, function(m) {
                console.log('    m - '  + m.type() + ' ' + ((dns)?m.name():m.ip()) ); 
                if (viewLine) _.each(m.line, function(l) {console.log('    + ' + l) });
            });
    });

    console.log('Mach Ext');
    _.each(_(v.extMachines).sortBy('_ip'), function(d) {
        console.log('   ' + d.type() + ' ' + ((dns)?d.name()+' ('+d.ip()+')':d.ip()) );
          if (viewLine)  _.each(d.line, function(l) {console.log('    + ' + l) });
    });

});

