'use strict';

const taliaProtocol = require('./modules/talia-client');
const name = process.argv[2];

if (name === 'undefined') {
    console.log('Err : Not valid syntax: node client.js network.group:peername?passwod');
    process.exit(1);
}
if (!taliaProtocol.getUNI(name)) {
    console.log('Err : protocol syntax illegal: network.group:peername?passwod');
    process.exit(1);
}

console.log("Update server...");

taliaProtocol.registerPeer(function (exp) {
    console.log('Server Response: ');
    if (exp === false)
        console.log('Connection Failure');
    else {
        // Prints message returned by server:
        console.log(exp);
        console.log('Peers: ');
        // Prints only the peers.
        console.log(taliaProtocol.networkPeers());
    }
});