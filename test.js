const dns = require('dns');
function iPAddress(domain) {
    let ip;
    const lookUp = function () {
        dns.lookup(name, (err, address, family) => {
            if (err)
                throw err;

            flag = true;
            ip = address;
        });
    };
    function printIpAddress() {
        console.log(ip);
    };
    console.log('hey!');

    return {
        domain: domain,
        printIP : printIpAddress
    };

/*
    let nsLookup = function(domain, timeout, callback) {
        let callbackCalled = false;
        let doCallback = function(err, domains) {
            if (callbackCalled) return;
            callbackCalled = true;
            callback(err, domains);
        };
        setTimeout(function() {
            doCallback(new Error("Timeout exceeded"), null);
        }, timeout);

        dns.resolveNs(domain, doCallback);
    };*/
};

const addre = iPAddress('www.ynet.co.il');
addre.printIP();


const counterIntervalID = function(a) {
    return setInterval(() => {
        console.log(a++);
    }, 1000);
};
function startCounter(counter) {
    return setInterval(() => {
        console.log(++counter);
    }, 1000);
}

const counterId = startCounter(5);

setTimeout(() => {
    clearInterval(counterId);
}, 5000);

