/**
 
 Extend Netmask to add acls lines
 
**/

var _ = require("underscore")._;

var Netmask = require('netmask').Netmask;
//var ip2long = require('netmask').ip2long;
//var long2ip = require('netmask').long2ip;

function Network(net,mask) {
    this.net = new Netmask(net, mask);
    this.line = [];
    this._type = 'Client',
    this.inMachine = [];
};

Network.prototype = {
   type : function() { return this._type },
SetType : function(t) {
    if ( !this._type ||
        (t === 'ServPub' && this._type !== 'ServPub') ||
        (t === 'ServInt' && this._type === 'Client')
       )
         this._type = t
   }
};

module.exports =  Network;
