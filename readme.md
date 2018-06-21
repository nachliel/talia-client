# Talia Peer Exchange Protocol

## Overview

Talia PEX (Peer Exchange Protocol) is a online service to support exchange of peer's addresses.
In a world that moves toward Decntrilized Application, one needs of finding and connecting with other peers is on demand.
This service enable peers to create a network or join a network by sending a simple datagram packet to the service server.
the packet must contain a legal UNI - Uniform Network Identifier that will identify the network the peer belongs, and
will update the current IP of the peer with other included parameters.
This will enable other peers on the same network to know about different peers, their location and their role in the network.
Networks can have groups, and passwords.
each peer can register in each group, network, as long he has access. and recognize himself by name.
Peer networks are dynamic, and do not hold for long. if peer has not updated the service for too long, it will be deleted from the network.
Networks that are empty will be deleted also.

Talia can be used as infrastructure of DAPPS, and have many more uses.
can be used for dynamic IP servers, to connect a work-group around the world.
to access personal computer and phones that make use of different IP each time.

## UNI - Uniform Network Identifier
Like URL, UNI identify the network the peer belongs.

### Structure
The structure of UNI is very simple and contain 4 groups: Network, group, name, password.
The syntax of the UNI is as follows:
`` NetworkName.GroupName:PeerName?Password ``
UNI is not Case-Sensitive. and it is registered in lower case only. including passwords and names.

**Regular Expression Validation**
''/^([0-9a-z]{4,20})(\.([0-9a-z]{2,6}|\*\*))?(:([0-9a-z]{2,8}))?(\?([0-9a-z]{6,20}))?$/''
* NetworkName    - 0 - 9  a - z , [4 to 20 letters]
* GroupName      - 0 - 9  a - z , [2 to 6 letters]  (Optional)
* Peer           -  a - z , [ 4 to 8 letters] (optional)
* Password       - 0 - 9  a - z , [6 to 20 letters]  (optional)

Examples:

``networkname.home:server`` - register peer in home group on networkname network

``networkname:phone`` - register peer on networkname network named phone

``networkname.group1`` - register peer in group1 on networkname network.

``networkname2.com:server?secret1235`` - register new network name, and adding new peer named 'server' to 'com' group. with the password 'secret1235'

``networkname2.newgroup:avipc?secret1235`` - add new peer to 'newgroup' named avipc. password is only for network name. Must on register.

## talia.js
talia.js is a simple commandline tool to register and receive peers over Talia Peer Exchange Protocol.
talia.js make use of the module talia-client.js that can be used in any other p2p program to find peers over network, without the need for hardcoded peers.
by those making the DAPPS much stronger and reliable.

### Usage: node talia.js command <UNI>
command: reg | r <UNI> - will register / update the peer, get response without showing peers.
         recv | u <UNI> - will register / update peer on network, but will show only peers.


### Structure of response from Talia Service:
```json
{
  "code" : #

  "queryCode" : #

  "timeOfRequest" : date.Now(),

  "queryHash" : Hash of buffer.

  "peers" : [
    {
      "address" : "ip(122.122.122.122)",
      "name" : "client/server/peer/whatever...",
    }
  ]
}
```

### Response Codes from Talia Server:
    STATUS_NEW_NAMESPACE    : 600  // Create new Network Name
    STATUS_NEW_PEER         : 601  // Create New Peer
    STATUS_UPDATE           : 602  // Update Peer
    STATUS_NEW_ERROR_0      : 630  // Unknown Error 0
    STATUS_NEW_ERROR_1      : 631  // Unknown Error 1
    STATUS_REQUEST_FULFILLED: 632  // Unknown Error 1
    IPV4                    : 32   // IPV4 FLAG Also # of bytes
    IPV6                    : 64   // IPV6 Flag and # of bytes

    RESPONSE_NO_ERROR       : 610  // NO ERROR : O.K
    RESPONSE_FORMAT_ERROR   : 611  // Message format incorrect
    RESPONSE_SERVER_FAILURE : 612  // Server failed
    RESPONSE_NAME_ERROR     : 613  // Name Doesn't exist
    RESPONSE_NOT_IMPLEMENTED: 614  // Type of query not supported
    RESPONSE_NOT_AUTH       : 615  // Not authoritative to make changes
    REQUEST_FAILED          : 616  // Request Failed - Not specified
    REQUEST_REJECTED        : 617  // Client Rejected by server :Respawn 3 times, then block.
    RESPONSE_DB_FAILURE     : 618  // Database Server failed

                                    // QUERY FLAGS
    QUERY_REGULAR           : 650  // Regular request
    QUERY_REFRESH           : 651  // Refresh time only, Update. status
    QUERY_DNS               : 655  // LookUP request
    QUERY_DB_TEST           : 652  // Test DataBase
    QUERY_REQUEST           : 653  // Regular request

    FLAG_AUTH_TRUE          : 640  // Authorization enabled
    FLAG_AUTH_FALSE         : 641  // Authorization failure
