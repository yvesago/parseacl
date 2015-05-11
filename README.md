
parseacl - A Cisco ACL parser
===================


[![Build Status](https://travis-ci.org/yvesago/parseacl.svg?branch=master)](https://travis-ci.org/yvesago/parseacl)


## Description

A cisco ACL parser. 

Produce a node object from interface and extended acl input.

Currently only for IPv4.

## Install

   npm install parseacl



## Usage

    var Vlan = require('parseacl');
    
    var config = require('./config'); // optional
    
    fs.readFile(filePath, function(err,data){
       data = data.split("\n");
       var v = new Vlan(config); // or new Vlan()
       v.Parse(data);
       
       console.log(JSON.stringify(v, null, 2));
    });




For the use of an optional config module, watch  example/config-ex.js

## See Also

 [viewacl](https://github.com/yvesago/viewacl) - A Meteor JS web viewer


## Licence

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


