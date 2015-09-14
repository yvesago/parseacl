var config = {};

config.dnsTimeout = 10;

config.fullPolicy = [
{'reg': 'deny ip any  any',
 'com': 'continue',
 'color': ''},
{'reg': 'permit tcp any  any established',
 'com': 'continue',
 'color': ''},

{'reg': 'permit tcp any  any eq ident' ,
 'com': 'OK',
 'color': 'green'},
{'reg': 'permit icmp any  any' ,
 'com': 'OK',
 'color': 'green'},

{'reg': 'deny udp any  any eq 2049 log' ,
 'com': 'inutile',
 'color': 'orange'},

{'reg': 'permit udp any eq ntp any' ,
 'com': 'use gateway',
 'color': 'red'},
{'reg': 'permit udp any eq domain any' ,
 'com': 'use a fix dns server',
 'color': 'red'},

]

module.exports = config;
