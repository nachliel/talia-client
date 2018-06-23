'use strict';
const dgram = require('dgram');

const crypto = require('crypto');

const dns = require('dns');



module.exports =(function taliaClient() {

    // ----------------------------------------------------------------------- //
    /***********************************************************************************
     * Usage:
     *      const taliaProtocol = require('./pexp');
     *      if (!taliaProtocol.getUNI(uni)) {
     *          console.log('Err : protocol syntax illegal: network.group:peername?passwod');
     *          process.exit(1);
     *      }
     *
     *
     *      taliaProtocol.registerPeer(function (exp) {
     *              exp contain server response: Object.
     *              // Prints only the peers.
     *              console.log(pex.networkPeers);
     *          });
     *      }
     **********************************************************************************/
    /**********************************************************************************
     * JSON Server Response structure:
     * {
     *   "code" :
     *
     *   "queryCode" :
     *
     *   "timeOfRequest" : date.Now(),
     *
     *   "queryHash" : Hash of buffer.
     *
     *   "networkName" : Name of network
     *
     *   "groupName"   : Group Name
     *
     *   "peers" : [
     *     {
     *       "address" : "ip(122.122.122.122)",
     *       "name" : "client/server/peer/whatever...",
     *     }
     *   ]
     *
     * }
     **********************************************************************************/

    let ipTalia;                            // Server IP. in due time it will be address to lookup.

    const TALIAPORT = 50001;                // Server Port.

    const TIMEOUT = 2000;                   // Set timeout:

    const TALIADOMAIN = 'udp.talia-pex.net';

    const MaxPacketSend = 5;                // Maximum number of packets to be sent.
                                            // UNI REGEX
    const protocolRegex = /^([0-9a-z]{4,20})(\.([0-9a-z]{2,6}|\*\*))?(:([0-9a-z]{2,8}))?(\?([0-9a-z]{6,20}))?$/;

    let protocolName;                       // Name of protocol Name

    let networkPeers = [];                  // Network Peers, filled when callServer,

    let packets = [];                       // packet handler for multiple packets.

    let packetintervalID;                   // For try sending multiple packet on udp failure ID

    let intervalID;                         // Interval update ID



    //------------------------------------------------------------------------------//
    //                      Peer Handler Functions                                  //
    //------------------------------------------------------------------------------//

    /**
     * Convert String IP address to integer      xxx.xxx.xxx.xxx -> INTEGER
     * @param ip
     * @returns number
     */
    function ip2Integer(ip) {
        if (typeof ip !== 'string')
            throw 'Err: ip is not a string.';
        let octets = ip.split(/[.]+/);
        let num = 0;
        for (let i=3; i >= 0; i--) {
            num += ((octets[3-i])%256 * Math.pow(256,i));
        }
        return num;
    }
    /**
     * Convert the ip to string.                INTEGER -> xxx.xxx.xxx.xxx
     * @param ip - number type ip
     * @returns string - ip address, string format
     */
    function ipInt2Str(ip) {
        if (typeof ip !== 'number')
            throw 'Err: ip is not a string.';
        return ((ip >> 24 ) & 0xFF) + "." + ((ip >> 16 ) & 0xFF) + "." + ((ip >>  8 ) & 0xFF) + "." + ( ip & 0xFF);
    }

    /**
     * Convert All IP's in networkPeers array to Integer IP.
     * @param ips - Optional (Array of INT IP's) - return new converted ip's array.
     * @returns Array - Optional
     */
    function peerIpsInt2Str(ips) {
        if (typeof  ips === 'undefined' && typeof networkPeers!=='undefined') {
            for (let i in networkPeers) {
                networkPeers[i].ip = ipInt2Str(networkPeers[i].ip);
            }
        }
        else
        {
            let newIps = [];
            for (let i in ips) {
                newIps[i] = ipInt2Str(ips[i]);
            }
            return newIps;
        }
    }

    /**
     * Convert All IP's in networkPeers array to String IP.
     * @param ips - Optional (Array of String IP's) - return new converted ip's array.
     * @returns Array - if parameter is defined,
     */
    function peerIpsStr2Int(ips) {
        if (typeof  ips === 'undefined') {
            for (let i in networkPeers) {
                networkPeers[i].ip = ip2Integer(networkPeers[i].ip);
            }
        }
        else
        {
            let newIps = [];
            for (let i in ips) {
                newIps[i] = ip2Integer(ips[i]);
            }
            return newIps;
        }
    }

    function peers() {
        return networkPeers;
    }


    function get_uni() {
        return protocolName;
    }

    //------------------------------------------------------------------------------//
    //                      Peer Exchange Protocol Functions                        //
    //------------------------------------------------------------------------------//
    function lookUp(callback) {
        dns.lookup(TALIADOMAIN, (err, address) => {
            if (err)
                throw err;
            ipTalia = address;
            callback();
        });
    }

    function insertUNI(uni) {
        if (isNameValid(uni)) {
            protocolName = uni;
            return true;
        }
        else
            return false;
    }

    /**
     * Returns True if UNI - Uniform Network Identifier is legal under Peer Exchange Protocol Standards
     * @param uniProtocolName - networkname.group:peername?password - string
     * @returns {boolean}
     */
    function isNameValid(uniProtocolName) {
        return protocolRegex.test(uniProtocolName);
    }

    /**
     * send UDP packet
     * @param buffer - message to send
     * @param socket - socket to use.
     */
    function sendPacket(buffer, socket) {
        socket.send(buffer, 0, buffer.length, TALIAPORT, ipTalia, function (err) {
            if (err)
                throw err;
        });
    }


        /**
     * This will send packet by default interval time.
     * @param buffer - buffer of message
     * @param socket - socket for sending UDP.
     * @param callback - callback on error
     */
    function sendPacketInterval(buffer, socket, callback) {
        sendPacket(buffer,socket);

        packetintervalID = packetIntervalSender(buffer, socket);
    }



    function packetIntervalSender(buffer, socket) {
        let packetsSend = 1;

        return setInterval(() => {
            packetsSend++;
            sendPacket(buffer, socket);
            if (packetsSend === MaxPacketSend) {
                clearInterval(packetintervalID);
                console.log("ERR: Time out... Server unreachable.");
                socket.close();
            }
        }, TIMEOUT);
    }

    /**
     * Stopping the packet sender interval. use when receiving of datagrams back from server to stop try sending packets.
     */
    function stopPacketIntervalUpdate() {

        if (packetintervalID !== 'undefined') {
            clearInterval(packetintervalID);
        }
    }

    function isMultiPacket(buffer) {
        if (buffer[0] !== '{') {
            return false;
        }

        let i = 0;
        let packetInfo = {};
        packetInfo.packetNumber = '';
        packetInfo.outOf = '';
        packetInfo.index = 0;

        while(buffer[i] !== '/') {
            packetInfo.packetNumber += buffer[i];
            i++;
        }
        while(buffer[i] !== '{') {
            packetInfo.outOf += buffer[i];
            i++;
        }
        packetInfo.index = i - 1 ;
        return packetInfo;
    }

    function regPeer(callback) {
        if (typeof ipTalia === 'undefined') {
            lookUp(() => {
                callServer((feed) => {
                    callback(feed);
                });
            });
        }
        else {
            callServer((feed) => {
                callback(feed);
            });
        }
    }

    /**
     * Makes a call to the main server and register request for namespace.
     * Call once.
     * @param callback - on success.
     * @returns {number} - on fail.
     */
     function callServer(callback) {
        // Create UDP Socket
        const socketListener = dgram.createSocket('udp4');

        socketListener.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            socketListener.close();
        });

        // Event on new message. *datagram packet
        socketListener.on('message', (msg, rinfo) => {
            // Check for the packet expected:
            if (rinfo.address === ipTalia && rinfo.port === TALIAPORT) {
                // Check for large packet... i.e multiple packet.
                stopPacketIntervalUpdate();
                let packetInfo = isMultiPacket(msg);
                if (packetInfo === false) {     // Packet is one.
                    // Converts msg to Object
                    let feedBack = JSON.parse(msg);
                    // Compare the hash of queries
                    if (crypto.createHmac('sha256', protocolName.toString()).digest('hex') === feedBack.queryHash) {
                        socketListener.close();
                        // get only the peers from feedback.
                        /** @namespace feedBack.peers */
                        networkPeers = feedBack.peers;
                        // return to callback - feedback obj from server.
                        callback(feedBack);
                    }
                }       // In case of large packets.
                else {
                    packets[packetInfo.packetNumber] = msg.substring(packetInfo.index);    // Get the packety buffer without the Packet number and out of.
                    let gotAllPacketsFlag = true;
                    let largeBuffer = '';
                    // Check if we recived all packets related:
                    for(let i = 1; i <= packetInfo.outOf; i++) {
                        if (packets[i] === undefined ) {
                            gotAllPacketsFlag = false;
                            break;
                        }
                        else {
                            largeBuffer = largeBuffer + packets[i];
                        }
                    }
                    if (gotAllPacketsFlag) {
                        // Converts msg to Object
                        let feedBack = JSON.parse(largeBuffer);
                        // Compare the hash of queries
                        /** @namespace feedBack.queryHash */
                        if (crypto.createHmac('sha256', protocolName.toString()).digest('hex') === feedBack.queryHash) {
                            socketListener.close();
                            // get only the peers from feedback.
                            /** @namespace feedBack.peers */
                            networkPeers = feedBack.peers;
                            // return to callback - feedback obj from server.
                            callback(feedBack);
                        }
                    }
                }
            }
        });

        // Event: start listen for incomming dgrams. Close when get the packet.
        socketListener.on('listening', () => {
            //sendPacket(this.protocolName,3,socketListener);
            sendPacketInterval(protocolName,socketListener,callback);
        });
        // bind socket to port
        socketListener.bind(TALIAPORT);
    }

    /**
     * Update server, one way.
     */
     function updateServer() {
        const socketListener = dgram.createSocket('udp4');
        sendPacket(protocolName, socketListener);
    }

    /**
     * Activate Interval Update, time in ms.
     * @param intervalTime
     */
     function startIntervalUpdate(intervalTime) {
        intervalID = intervalUpdate(intervalTime);
     }

    function intervalUpdate(interval) {
        return setInterval(() => {
            updateServer();
        }, interval);
    }

    /**
     * stop Interval.
     */
    function stopIntervalUpdate() {
        if (intervalID !== 'undefined') {
            clearInterval(intervalID);
        }
    }

    return {
        registerPeer : regPeer,
        getUNI : insertUNI,
        startIntervalUpdate :startIntervalUpdate,
        stopIntervalUpdate : stopIntervalUpdate,
        networkPeers : peers,
        get_uni : get_uni,
        peerHandler : {
            ip_str2int : ip2Integer,
            ip_int2str : ipInt2Str,
            peers_int2str : peerIpsInt2Str,
            peers_str2int : peerIpsStr2Int
        }
    }
})();