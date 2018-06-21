'use strict';
/**
 * Client Test for Peer Exchange Protocol.
 * Syntax of Unique Network Name:
 * NetworkName.GroupName:PeerName?Password
 * NOT CASE SENSITIVE! (convert all messages to lower-case including password)
 * - NetworkName    - 0 - 9  a - z , [4 to 20 letters]
 * - GroupName      - 0 - 9  a - z , [2 to 6 letters]  (Optional)         // Newer version support  2 - 8 letters need to update server.
 * - Peer           -  a - z , [ 4 to 8 letters] (optional)         // Newer version support numbers and 2 - 8 letters need to update server.
 * - Password       - 0 - 9  a - z , [6 to 20 letters]  (optional) -- Only for Network Name, On register. code 600
 */

const PEXProtocol = require('./modules/talia-client');
const name = process.argv[2];

/**
 * Options:
 *          networkname.home:server  - register peer in home group on networkname network
 *          networkname:phone        - register peer on networkname network named phone
 *          networkname.group1       - register peer in group1 on networkname network.
 *          networkname2.com:server?secret1235 - register new network name, and adding new peer named 'server' to 'com' group. with the password 'secret1235'
 *          networkname2.newgroup:avipc?secret1235 - add new peer to 'newgroup' named avipc. password is only for network name. Must on register.
 */

const pex = new PEXProtocol(name);

if (name === 'undefined') {
    console.log('Err : Not valid syntax: node client.js network.group:peername?passwod');
    process.exit(1);
}
if (!pex.validName) {
    console.log('Err : protocol syntax illegal: network.group:peername?passwod');
    process.exit(1);
}

console.log("Update server...");

pex.callServer(function (exp) {
    console.log('Server Response: ');
    if (exp === false)
        console.log('Connection Failure');
    else {
        // Prints message returned by server:
        console.log(exp);
        console.log('Peers: ');
        // Prints only the peers.
        console.log(pex.networkPeers);
    }
});
/*
setTimeout(function(){
    pex.callServer(function (exp) {
        console.log('Server Response: ');
        console.log('Peers: ');
        // Prints only the peers.
        console.log(pex.networkPeers);
    });
}, 2000);


 //Additional Options
// Set Interval Update of server
//pex.startIntervalUpdate(4000);

// Turn off interval:
//pex.stopIntervalUpdate();


/*
JSON Server Response structure:
{
  "code" :

  "queryCode" :

  "timeOfRequest" : date.Now(),

  "queryHash" : Hash of buffer.

  "peers" : [
    {
      "address" : "ip(122.122.122.122)",
      "name" : "client/server/peer/whatever...",
    }
  ]
}

// Response codes for client

    STATUS_NEW_NAMESPACE    : 600,  // Create new Network Name
    STATUS_NEW_PEER         : 601,  // Create New Peer
    STATUS_UPDATE           : 602,  // Update Peer
    STATUS_NEW_ERROR_0      : 630,  // Unknown Error 0
    STATUS_NEW_ERROR_1      : 631,  // Unknown Error 1
    STATUS_REQUEST_FULFILLED: 632,  // Unknown Error 1
    IPV4                    : 32,   // IPV4 FLAG Also # of bytes
    IPV6                    : 64,   // IPV6 Flag and # of bytes

    RESPONSE_NO_ERROR       : 610,  // NO ERROR : O.K
    RESPONSE_FORMAT_ERROR   : 611,  // Message format incorrect
    RESPONSE_SERVER_FAILURE : 612,  // Server failed
    RESPONSE_NAME_ERROR     : 613,  // Name Doesn't exist
    RESPONSE_NOT_IMPLEMENTED: 614,  // Type of query not supported
    RESPONSE_NOT_AUTH       : 615,  // Not authoritative to make changes
    REQUEST_FAILED          : 616,  // Request Failed - Not specified
    REQUEST_REJECTED        : 617,  // Client Rejected by server :Respawn 3 times, then block.
    RESPONSE_DB_FAILURE     : 618,  // Database Server failed

                                    // QUERY FLAGS
    QUERY_REGULAR           : 650,  // Regular request
    QUERY_REFRESH           : 651,  // Refresh time only, Update. status
    QUERY_DNS               : 655,  // LookUP request
    QUERY_DB_TEST           : 652,  // Test DataBase
    QUERY_REQUEST           : 653,  // Regular request

    FLAG_AUTH_TRUE          : 640,  // Authorization enabled
    FLAG_AUTH_FALSE         : 641   // Authorization failure
 */