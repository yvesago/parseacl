/***
 Copyright (C) 2015 Yves Agostini  
 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
      
 Contact the copyright holder for commercial licensing terms
 if you wish to incorporate this code into non-GPL software.
      
 <yves+npm@yvesago.net>

    
Usage :

  var Vlan = require('parseacl');
  
  var config = require('./config'); // optional

  fs.readFile(filePath, function(err,data){
     data = data.split("\n");
     var v = new Vlan(config); // or new Vlan()
     v.Parse(data);

     console.log(JSON.stringify(v, null, 2));
  });

optional config module; watch config-ex.js

***/

var _ = require("underscore")._;
var Machine = require('./Machine');
var Network = require('./Network');

//var Netmask = require('netmask').Netmask;
var ip2long = require('netmask').ip2long;
var long2ip = require('netmask').long2ip;


/***
*  RegExp
***/

var namePat = new RegExp(/interface (\w+?)\s*?$/);
var descPat = new RegExp(/description\s*(.*?)\s*$/);
//var netPat = new RegExp(/ip address (.*?)(?: secondary)?\s+?$/);
var inoutPat = new RegExp(/(ip access-group|ipv6 traffic-filter) (.*?) (in|out)\s*?$/);

var acces ="permit|deny";
var proto ="\\w+"; // proto ="tcp|udp|ip|icmp...";
var ip ="\\d+\\.\\d+\\.\\d+\\.\\d+"; // TODO IPv6
var machine ="any|host "+ip+'|'+ip+' '+ip;
var port ="\\w+ [\\w\\d-]+(?: \\w+)?";
var hostip = '^host ('+ip+'?)$';

var nettest = new RegExp(
  '('+acces+') ('+proto+') ('+machine+')(?: ('+port+'))? ('+machine+')(?: ('+port+'|established))?(.*)'
  );
var netPat = new RegExp('('+ip+') ('+ip+')');
var netaddPat = new RegExp('ip address ('+ip+') ('+ip+')');


/**
 Object Vlan
**/

function Vlan(config) {
    this.name = '';
    this.intNetworks = [],
    this.extNet = [],
    this.intSubNet = [],
    this.extSubNet = [],
    this.intMachines = [],
    this.extMachines = [],
    this.fullnet = [],
    this.score = 0,
    this.config = config
};

/**

Parse prototype

**/

Vlan.prototype.Parse = function (data) {
    var v = this;
    var aclout = '', inaclname = '', outaclname = '';
    var acloutPat, aclinPat;
    var aclV6outPat, aclV6inPat;
    var dnsTimeout = 10;
    if (v.config && v.config.dnsTimeout) dnsTimeout = v.config.dnsTimeout;
    data.forEach(function(value) {
     if (value[0] === '!') return true; // remove comment
     //console.log('-' + value);
     if (aclout === '') {
      var name =  value.match(namePat);
      if (name) v.name =  name[1];
      var desc =  value.match(descPat);
      if (desc) v.desc = desc[1].replace(/\s*\*+\s*/g,'');
      var net = value.match(netaddPat);
      if (net) _.insertNetBlock(v.intNetworks,net[1],net[2],0);
     }

     var inout = value.match(inoutPat);
     if(inout && inout[1] === 'ip access-group') {
      if (inout[3] === 'in') {
        inaclname = inout[2]
        aclinPat = new RegExp('ip access-list extended '+inaclname);
        }
      if (inout[3] === 'out') {
        outaclname = inout[2]
        acloutPat = new RegExp('ip access-list extended '+outaclname);
        }
      };
     if(inout && inout[1] === 'ipv6 traffic-filter') {
      if (inout[3] === 'in') {
        var inaclV6name = inout[2]
        aclV6inPat = new RegExp('ipv6 access-list '+inaclV6name);
        }
      if (inout[3] === 'out') {
        var outaclV6name = inout[2]
        aclV6outPat = new RegExp('ipv6 access-list '+outaclV6name);
        }
      };
      //
      //
      if (acloutPat && value.match(acloutPat)) aclout = 1;
      if (aclinPat && value.match(aclinPat)) aclout = 0;
      // start IPv6 parsing
      if (aclV6outPat && value.match(aclV6outPat)) aclout = '';
      if (aclV6inPat && value.match(aclV6inPat)) aclout = '';

      if (aclout !== '') {
       //console.log('-' + aclout + '-' +  value);
       ///^($acces) ($proto) ($machine)(?: ($port))? ($machine)(?: ($port))?(.*)/
       var test = value.match(nettest);
       if (test) {
        var permit = false;
        if (test[1] === 'permit') permit = true;
        //if (test[1] === 'deny') return true;
        //(aclout)?console.log('OUT'):console.log(' in');

        //console.log(' acces : '+test[1]+' '+test[2]); // permit proto

        var line = (aclout) ? outaclname : inaclname;
        line = line + ' ' + test.slice(1,7).join(' ');
        // anti spoofing
        if (aclout && line.match(/deny ip 127.0.0.0/) ) return;

        var machExt = test[3];
        if ( hIPext = machExt.match(hostip) ) { //  host ip (src out)
            var type = 'Client';
            if ( hIPext[1].match(/255/g) ) type = 'Broadcast';
            if (type === 'Broadcast') return;

            (aclout) ?
             //_(v.extMachines).insertMachine(hIPext[1]):
             //_(v.intMachines).insertMachine(hIPext[1]);
             _.insertMachine(v.extMachines, hIPext[1], type, line, dnsTimeout):
             _.insertMachine(v.intMachines, hIPext[1], type, line, dnsTimeout);
        }
        else if ( net = machExt.match(netPat) ) { // net (src out)
         var testnet = _.containsNetBlock(v.intNetworks,net[1],net[2],1);
         if ( testnet === 'Exist' ) {
             machExt = 'NETINT';
             }
             else {
              (aclout) ?
                 ( (testnet === 'Subnet') ?
                    _.insertNetBlock(v.intSubNet,net[1],net[2],1,line) :
                    _.insertNetBlock(v.extNet,net[1],net[2],1,line)
                 ) :
                 _.insertNetBlock(v.intSubNet,net[1],net[2],1,line);
             };
        }
        else if (machExt === 'any') {
            machExt = 'SERVER'; //(out)
        };
        //console.log('  machine ext: '+machExt);

        //if (test[4]) console.log('  port src : '+test[4]);

        var machInt = test[5];
        if ( hIPext = machInt.match(hostip)) { // host ip (dst out)
            var type = (aclout) ? 'ServInt': 'Client';
            if ( hIPext[1].match(/255/g) ) type = 'Broadcast';
            if (type === 'Broadcast') return;
            if (machExt === 'SERVER' && aclout && permit) type = 'ServPub';
            (aclout) ?
             _(v.intMachines).insertMachine(hIPext[1], type, line, dnsTimeout) :
             _(v.extMachines).insertMachine(hIPext[1], type, line, dnsTimeout);
        }
        else if ( net = machInt.match(netPat) ) { // net (dst out)
         var testnet = _.containsNetBlock(v.intNetworks,net[1],net[2],1, line);
         if ( testnet === 'Exist' ) {
             //machInt = 'NETINT'; ???
             machInt = 'FULLNET';
             }
             else if (testnet === 'Subnet' ) {
              _.insertNetBlock(v.intSubNet,net[1],net[2],1, line);
              //increase score on internal permit subnet
              if (permit && aclout) v.score++;
             };
             // TODO any sens here ??
        }
        else if (machInt === 'any') {
            machInt = 'FULLNET';
        };
        //console.log('   ->machine int : '+machInt);

        //if (test[6]) console.log('   port dst : '+test[6]);

        // analyse
        if (machExt === 'SERVER' && (machInt === 'FULLNET' || machInt === 'NETINT') ) {
            var com = '', color='';
            if (v.config)
              _.each(v.config.fullPolicy, function (c) {
                if (line.match(new RegExp(c.reg)) ) {
                    com=c.com; color =c.color;
                    v.score += ( c.score || 0 ); //add score from config file
                };
              });
            if (com.match(/^continue$/)) return;
            v.fullnet.push({'line':line,'com':com,'color':color});
            }
        };
       };
    });

// Post traitement group machines in subnet, set network type
_.each(v.intMachines, function (m) {
   _.each(v.intNetworks,function(d) {
       if ( d.net.contains(m.ip()) ) {
           v.score++;
           d.SetType(m.type());
       }
   });
   _.each(v.intSubNet,function(d) {
       if ( d.net.contains(m.ip()) ) {
           v.intMachines = _.without(v.intMachines,m);
           d.inMachine.push(m);
           d.SetType(m.type());
       }
   });
});

_.each(v.extMachines, function (m) {
   _.each(v.extSubNet,function(d) {
       if ( d.net.contains(m.ip()) ) {
           v.extMachines = _.without(v.extMachines,m);
           d.inMachine.push(m);
           v.score++;
       }
   });
});

return v;

};

/**

 more methods to manage array of objects

**/

_.mixin({
    insertMachine: function(arr, child, type, line, dnsTimeout) {
            var machine = _.find( arr, function (o) {
                if (o.ip() === child)  return o;
                return null;
            });
            if (!machine) {
                machine = new Machine(child,dnsTimeout);
                arr.push(machine);
            };
            if (type) machine.SetType(type);
            if (line) _.insertLine(machine.line,line);
            return arr;
           },
    containsNetBlock: function(arr, net, mask, cidr, line) {
           if (cidr) mask = long2ip(~ip2long(mask));
           var newbl = new Network(net, mask); 
           var res; 
           _.find( arr, function (bl) {
                if (bl.net.toString() === newbl.net.toString() ) { res = 'Exist'; return};
                if (bl.net.contains(newbl.net.toString()) ) res = 'Subnet'
                return;
           });
           //console.log(res);
           return res;
           },
    insertLine: function(arr,l) {
        if (!_.contains(arr, l))
              arr.push(l);
        return arr;
           },
    insertNetBlock: function(arr, net, mask, cidr, line) {
           if (cidr) mask = long2ip(~ip2long(mask));
           var newbl = new Network(net, mask); 
           var res = _.find( arr, function (bl) {
                if (bl.net.toString() === newbl.net.toString() ) return bl;
                return null;
           });
           if (!res) {
                arr.push(newbl);
                res = newbl;
           };
            if (line) _.insertLine(res.line,line);
           return arr;
           },
     sortBy: function(arr, child) {
           return arr.sort(sort_by(child, false, function(a){return a.toString()}));
           }
});

// Utils

var sort_by = function(field, reverse, primer){
   var key = primer ?
       function(x) {return primer(x[field])} :
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     }
}



module.exports = Vlan;
