'use strict';
const dgram = require('dgram');

const crypto = require('crypto');

const pexIP = '35.180.100.123';         // Server IP. in due time it will be address to lookup.

const pexPort = 50001;                  // Server Port.

const TIMEOUT = 2000;                  // Set timeout:

module.exports = function PEXP(uni) {
    // ----------------------------------------------------------------------- //
    /***********************************************************************************
     * Usage:
     *      const PEXProtocol = require('./pexp');
     *      const pex = new PEXProtocol('networkname.groupname:peername?password');
     *      if (pex.validName) {  // Check if the UNI is valid. (Uniform Network Identifier)
     *          pex.callServer();
     *          pex.callServer(function (exp) {
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
     *   "peers" : [
     *     {
     *       "address" : "ip(122.122.122.122)",
     *       "name" : "client/server/peer/whatever...",
     *     }
     *   ]
     *   networkName : Name of network
     *   groupName   : Group Name
     * }
     **********************************************************************************/

    // TODO: When domain available: make sure to lookup for ip to send the packets.

    //------------------------------------------------------------------------------//
    //                      Peer Handler Functions                                  //
    //------------------------------------------------------------------------------//

    /**
     * Conver String IP address to integer      xxx.xxx.xxx.xxx -> INTEGER
     * @param ip
     * @returns {number}
     */
    const ipStr2Int = function ip2Integer(ip) {
        if (typeof ip !== 'string')
            throw 'Err: ip is not a string.';
        let octets = ip.split(/[.]+/);
        let num = 0;
        for (let i=3; i >= 0; i--) {
            num += ((octets[3-i])%256 * Math.pow(256,i));
        }
        return num;
    };
    /**
     * Convert the ip to string.                INTEGER -> xxx.xxx.xxx.xxx
     * @param ip - number type ip
     * @returns {string} - ip address, string format
     */
    const ipInt2Str = function int2IP(ip) {
        if (typeof ip !== 'number')
            throw 'Err: ip is not a string.';
        return ((ip >> 24 ) & 0xFF) + "." + ((ip >> 16 ) & 0xFF) + "." + ((ip >>  8 ) & 0xFF) + "." + ( ip & 0xFF);
    };

    /**
     * Convert All IP's in networkPeers array to Integer IP.
     * @param ips - Optional (Array of INT IP's) - return new converted ip's array.
     * @returns {Array} - Optional
     */
    const peerIpsInt2Str = function (ips) {
        if (typeof  ips === 'undefined' && typeof this.networkPeers!=='undefined') {
            for (let i in this.networkPeers) {
                this.networkPeers[i].ip = ipInt2Str(this.networkPeers[i].ip);
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
    };

    /**
     * Convert All IP's in networkPeers array to String IP.
     * @param ips - Optional (Array of String IP's) - return new converted ip's array.
     * @returns {Array} - if parameter is defined,
     */
    const peerIpsStr2Int = function (ips) {
        if (typeof  ips === 'undefined') {
            for (let i in this.networkPeers) {
                this.networkPeers[i].ip = ipStr2Int(this.networkPeers[i].ip);
            }
        }
        else
        {
            let newIps = [];
            for (let i in ips) {
                newIps[i] = ipStr2Int(ips[i]);
            }
            return newIps;
        }

    };

    //------------------------------------------------------------------------------//
    //                      Peer Exchange Protocol Functions                        //
    //------------------------------------------------------------------------------//
    /**
     * Returns True if UNI - Uniform Network Identifier is legal under Peer Exchange Protocol Standards
     * @param uniProtocolName - networkname.group:peername?password - string
     * @returns {boolean}
     */
    const isNameValid = function (uniProtocolName) {
        const protocolRegex = /^([0-9a-z]{4,20})(\.([0-9a-z]{2,6}|\*\*))?(:([0-9a-z]{2,8}))?(\?([0-9a-z]{6,20}))?$/; // Notice! New Regex not supported by server.
        return protocolRegex.test(uniProtocolName);
    };

    /**
     * send UDP packet
     * @param buffer - message to send
     * @param socket - socket to use.
     */
    const sendPacket = function(buffer, socket) {
        socket.send(buffer, 0, buffer.length, pexPort, pexIP, function(err, bytes) {
            if (err)
                throw err;
        });

    };
    // Maximum number of packets to be sent.
    const MaxPacketSend = 5;
    /**
     * This will send packet by default interval time.
     *
     * @param buffer - buffer of message
     * @param socket - socket for sending UDP.
     * @param callback - callback on error
     */
    this.sendPacketInterval = function (buffer, socket, callback) {
        console.log('Send Packet 1:');
        sendPacket(buffer,socket);
        this.packetSended = 1;

        this.packetintervalID = setInterval(() => {
            this.packetSended ++;
            console.log('packet sended: ' + this.packetSended);
            sendPacket(buffer, socket);

            if (this.packetSended === MaxPacketSend) {
                clearInterval(this.packetintervalID);
                console.log("ERR: Time out... Server unreachable.");
                socket.close();
                callback(false);
            }
        }, TIMEOUT);
    };
    /**
     * Stopping the packet sender interval. use when receiving of datagrams back from server to stop try sending packets.
     */
    this.stopPacketIntervalUpdate = function() {
        if (this.packetintervalID !== 'undefined') {
            clearInterval(this.packetintervalID);
            delete this.packetintervalID;
        }
    };

    /**
     * stop Interval.
     */
    this.stopIntervalUpdate = function() {
        if (this.intervalID !== 'undefined') {
            clearInterval(this.intervalID);
            delete this.intervalID;
        }
    };

    const isMultiPacket = function (buffer) {
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
    };

    /**
     * Makes a call to the main server and register request for namespace.
     * Call once.
     * @param callback - on success.
     * @returns {number} - on fail.
     */
    this.callServer = function (callback) {
        if (!this.validName)
            return -1;
        // Create UDP Socket
        const socketListener = dgram.createSocket('udp4');

        socketListener.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
            socketListener.close();
        });

        // Event on new message. *datagram packet
        socketListener.on('message', (msg, rinfo) => {
            // Check for the packet expected:
            if (rinfo.address === pexIP && rinfo.port === pexPort) {
                // Check for large packet... i.e multiple packet.
                this.stopPacketIntervalUpdate();
                let packetInfo = isMultiPacket(msg);
                if (packetInfo === false) {     // Packet is one.
                    // Converts msg to Object
                    this.feedBack = JSON.parse(msg);
                    // Compare the hash of queries
                    if (crypto.createHmac('sha256', this.protocolName.toString('utf8')).digest('hex') === this.feedBack.queryHash) {
                        socketListener.close();
                        // get only the peers from feedback.
                        this.networkPeers = this.feedBack.peers;
                        // return to callback - feedback obj from server.
                        callback(this.feedBack);
                    }
                }       // In case of large packets.
                else {
                    this.packets[packetInfo.packetNumber] = msg.substring(packetInfo.index);    // Get the packety buffer without the Packet number and out of.
                    let gotAllPacketsFlag = true;
                    let largeBuffer = '';
                    // Check if we recived all packets related:
                    for(let i = 1; i <= packetInfo.outOf; i++) {
                        if (this.packets[i] === undefined ) {
                            gotAllPacketsFlag = false;
                            break;
                        }
                        else {
                            largeBuffer = largeBuffer + this.packets[i];
                        }
                    }
                    if (gotAllPacketsFlag) {
                        // Converts msg to Object
                        this.feedBack = JSON.parse(largeBuffer);
                        // Compare the hash of queries
                        if (crypto.createHmac('sha256', this.protocolName.toString('utf8')).digest('hex') === this.feedBack.queryHash) {
                            socketListener.close();
                            // get only the peers from feedback.
                            this.networkPeers = this.feedBack.peers;
                            // return to callback - feedback obj from server.
                            callback(this.feedBack);
                        }
                    }
                }
            }
        });

        // Event: start listen for incomming dgrams. Close when get the packet.
        socketListener.on('listening', () => {
            //sendPacket(this.protocolName,3,socketListener);
            this.sendPacketInterval(this.protocolName,socketListener,callback);
        });
        // bind socket to port
        socketListener.bind(pexPort);
    };

    /**
     * Update server, one way.
     */
    this.updateServer = function (callback) {
        const socketListener = dgram.createSocket('udp4');
        sendPacket(this.protocolName, socketListener);
        callback();
    };

    /**
     * Activate Interval Update, time in ms.
     * @param intervalTime
     */
    this.startIntervalUpdate = function (intervalTime) {
        const callBack = function () {
            console.log('update server');
        };
        this.intervalID = setInterval(() => {
            this.updateServer(callBack);
        }, intervalTime);
    };

    /**
     * stop Interval.
     */
    this.stopIntervalUpdate = function() {
        if (this.intervalID !== 'undefined') {
            clearInterval(this.intervalID);
            delete this.intervalID;
        }
    };

    //------------------------------------------------------------------------------//
    //                      Constructor                                             //
    //------------------------------------------------------------------------------//

    this.validName = isNameValid(uni);

    this.protocolName = uni;        // Name of protocol Name

    this.networkPeers = [];         // Network Peers, filled when callServer,

    this.packets = [];              // packet handler for multiple packets.
};