'use strict';
const program = require('commander');
const taliaProtocol = require('./modules/talia-client');

program
    .version('0.1.0', '-v, --version')
    .description('Peer Exchange Protocol Client Connection')
    .option('-n --network <networkname>', 'Network Name', /^([0-9a-z]{4,20})$/g)
    .option('-g --group [groupname]', 'Group Name', /^([0-9a-z]{2,6}|\*\*)?$/g)
    .option('-r --peer [peername]', 'Peer Name', /^([0-9a-z]{2,8})?$/g)
    .option('-p --password [password]', 'Network Password', /^([0-9a-z]{6,20})?$/g)
    .action(() =>{

    });
program
    .command('reg <Networkname.GroupName:PeerName?Password>')
    .alias('r')
    .description('Register peer to Network')
    .action((uni) => {
        if (uni === 'undefined') {
            console.log('Err : Not valid syntax: node client.js network.group:peername?passwod');
            process.exit(1);
        }
        if (!taliaProtocol.getUNI(uni)) {
            console.log('Err : protocol syntax illegal: network.group:peername?passwod');
            process.exit(1);
        }

        console.log("Update server...");
        taliaProtocol.registerPeer(function (exp) {
            if (exp !== false) {    // Expression contain Object of Server response, on failure -  False.
                console.log('UNI: ' + uni);
                console.log('Server Response: ');
                // Prints message returned by server:
                console.log('Code: ' + exp.code);

                console.log('Query Code: ' + exp.queryCode);
                let d = new Date(0);
                console.log('Time Of Request: ' + d.setUTCSeconds(exp.timeOfRequest));
                console.log('Query Hash: ' + exp.queryHash);
                console.log('Network Name: ' + exp.networkName);
                console.log('group Name: ' + exp.groupName);
                console.log('Peers Number: ' + exp.peers.length)
            }
        });
    });
program
    .command('recv <Networkname.GroupName:PeerName?Password>')
    .alias('u')
    .description('Update peer to network and receive all peer connections')
    .action((uni) => {

        if (uni === 'undefined') {
            console.log('Err : Not valid syntax: node client.js network.group:peername?password');
            process.exit(1);
        }
        if (!taliaProtocol.getUNI(uni)) {
            console.log('Err : protocol syntax illegal: network.group:peername?password');
            process.exit(1);
        }

        console.log("Update server...");

        taliaProtocol.callServer(function (exp) {
            console.log('UNI: ' + uni);
            console.log('Server Response: ');
            // Prints message returned by server:
            console.log('Code: ' + exp.code);

            console.log('Peers: ' + exp.peers.length);
            console.log('Peer\tI.P Address');
            for(let i in exp.peers) {
                console.log((exp.peers[i].name || '') + '\t' + exp.peers[i].address);
            }
        });
    });
program
    .command('interval <uni> <time>')
    .alias('i')
    .description('Update peer to network by interval.')
    //.option('-t, --time <t>', 'Specify time to interval updates.', parseInt)
    .action((uni,time) => {

        if (uni === 'undefined') {
            console.log('Err : Not valid syntax: node client.js network.group:peername?password');
            process.exit(1);
        }
        if (!taliaProtocol.getUNI(uni)) {
            console.log('Err : protocol syntax illegal: network.group:peername?password');
            process.exit(1);
        }

        console.log("Update server by intervals of: " + time);
        taliaProtocol.startIntervalUpdate(time);
    });
program.on('--help', function(){
    console.log('   Client Connection for Peer Exchange Protocol.');
    console.log('   Command Line Syntax:');
    console.log('       $ command <uni>');
    console.log('       $ reg <uni> - Register UNI');
    console.log('       $ recv <uni> - Receive Peers from UNI');
    console.log('       $ interval <uni> <time> - Intervals update.');
    console.log('       $ -v / --version - version of program');
    console.log('       $ --help - prints help');
    console.log('   Uniform Network Identifier Syntax:');
    console.log('    NetworkName.GroupName:PeerName?Password');
    console.log('    * NOT case sensitive,');
    console.log('    - Network Name  - 0 - 9  a - z ,    [4 to 20 letters]');
    console.log('    - .Group Name  - 0 - 9  a - z ,      [2 to 6 letters] (Optional)');
    console.log('    - :Peer Name  - 0 - 9  a - z ,      [2 to 8 letters] (Optional)');
    console.log('    - ?Password  - 0 - 9  a - z ,      [6 to 20 letters] (Optional)');
    console.log('');
    console.log('   Examples:');

    console.log('reg networkname.home:server  - register peer in home group on networkname network');
    console.log('reg networkname:phone        - register peer on networkname network named phone');
    console.log('recv networkname.group1       - Receive all peers in group1 on networkname network.');
    console.log('reg networkname2.com:server?secret1235 - register new network name, and adding new peer named \'server\' to \'com\' group. with the password \'secret1235\'');
    console.log('reg networkname2.newgroup:avipc?secret1235 - add new peer to \'newgroup\' named avipc. password is only for network name. Must on register.');
});
program.parse(process.argv);