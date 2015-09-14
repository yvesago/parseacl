/**
 Machine Object
**/
var dns = require('dns');
var path = require('path'),
    util = require('util'),
    shell = require('shelljs');

function Machine(nip, timeout) {
  this._ip = nip;
  this._dnsTimeout = timeout;
  this._type = '';
  this.line = [];
};


Machine.prototype = {
    ip : function() { return this._ip },
  type : function() { return this._type },
  name : function() {
    var self = this;
    if (self._name) return self._name;
    self._name = resolve(self._ip,self._dnsTimeout);
    return self._name;
   },
//shortname : TODO   
SetType : function(t) {
    if ( !this._type || 
        (t === 'ServPub' && this._type !== 'ServPub') ||
        (t === 'ServInt' && this._type === 'Client') 
       ) 
         this._type = t
   }
};


function resolve(ip,timeout) {
        var output,
            nodeBinary = process.execPath;

        // TODO IPv6
        if (!ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            console.error('Invalid IP:', ip);
            return null;
        }

        var scriptPath = path.join(__dirname, "./dns-resolve-script.js"),
            response,
            cmd = util.format('"%s" "%s" %s %s', nodeBinary, scriptPath, ip, timeout);

        response = shell.exec(cmd, {silent: true});
        if (response && response.code === 0) {
            output = response.output;
            if (output ){ // && net.isIP(output)) {
                return output;
            }
        }
        //console.error('hostname', "fail to resolve ip " + ip);
        return ip;
    }

module.exports = Machine;
