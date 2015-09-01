var assert = require('assert');

var Vlan = require('../');

var data = (function () {/*'! exemple 
interface Vlan12 
 description **** Reseau 12 ****
 ip address 192.168.10.254 255.255.255.0 secondary
 ip address 192.168.20.254 255.255.255.0 secondary
 ip address 192.168.20.254 255.255.255.0 secondary
 ip address 192.168.1.254 255.255.255.0
 ip broadcast-address 192.168.1.255
 ip access-group vlan12-in in
 ip access-group vlan12-out out
 ipv6 address 2001:DB8:503:10::1/64
 ipv6 address FE80::503:10 link-local
 ipv6 enable
 ipv6 traffic-filter vlan12-v6-in in
 ipv6 traffic-filter vlan12-v6-out out
! ==
ip access-list extended vlan12-out
! Spoofing
deny ip 192.168.10.0 0.0.0.255 192.168.10.0 0.0.0.255 log 
deny ip 192.168.20.0 0.0.0.255 192.168.20.0 0.0.0.255 log
deny ip 192.168.1.0 0.0.0.255 192.168.1.0 0.0.0.255 log  
! subnet
deny ip 192.168.10.96 0.0.0.31 192.168.10.0 0.0.0.255 log
! Connexions TCP 
permit tcp any any established
permit tcp any host 192.168.1.161 eq www
permit icmp any any 
! netmask bug: wait for pull request
! https://github.com/rs/node-netmask/pull/20
!permit ip host 192.168.100.12 192.168.1.10 0.0.0.1
! subnet
permit tcp host 192.168.168.183 192.168.20.0 0.0.0.31
! servint not pub
deny udp any host 192.168.10.183 eq snmp
! always servpub
deny udp any host 192.168.1.161 eq snmp
deny ip any any log
! ==
ip access-list extended vlan12-in
deny ip 192.168.1.0 0.0.0.255 any
! subnet
deny ip any 192.168.20.96 0.0.0.31
deny ip any any log
! ==
ipv6 access-list vlan12-v6-out
deny ipv6 2001:DB8:503:10::/64 2001:DB8:503:10::/64 log
deny ipv6 2001:DB8:503:11::/64 2001:DB8:503:11::/64 log
permit tcp any any established
permit tcp any any eq 22
permit ipv6 any host 2001:DB8:503:10::BB
permit tcp any host 2001:DB8:503:10::BB
permit udp any eq domain any gt 950
permit udp any eq domain any eq netbios-ns
!permit tcp any any eq ident
deny ipv6 any any log
! ==
ipv6 access-list vlan12-v6-in
permit ipv6 2001:DB8:503:10::/64 any
permit ipv6 2001:DB8:503:11::/64 any
deny ipv6 any any log
!*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

describe("Vlan parse", function() {
 data = data.split("\n");
 var v = new Vlan();
     v.Parse(data);
    //console.log(JSON.stringify(v, null, 2));
    it("Name and desc",function () {
     assert.equal(v.name,'Vlan12');
     assert.equal(v.desc,'Reseau 12');
    });
    it("3 int networks",function () {
     assert.equal(v.intNetworks.length,3);
    });
    it("4 fullnet IPv4 access",function () {
     assert.equal(v.fullnet.length,4);
    });
    it("int server",function () {
     assert.equal(v.intMachines.length,2);
     assert.equal(v.intMachines[0].ip(),'192.168.1.161');
     assert.equal(v.intMachines[0].type(),'ServPub');
     assert.equal(v.intMachines[0].line.length,2);
    });
    it("int SubNet",function () {
     assert.equal(v.intSubNet.length,3);
    });
    it("int server deny bug",function () {
     assert.equal(v.intMachines[1].type(),'ServInt');
    });
    it("Post proc give network Type",function () {
     assert.equal(v.intNetworks[2].type(),'ServPub');
    });
    it("Vlan score",function () {
     assert.equal(v.score,3);
    });
});
