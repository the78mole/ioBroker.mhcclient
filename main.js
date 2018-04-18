/**
 *
 * mhcclient adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "mhcclient",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    // use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js mhcclient Adapter",  // Adapter title shown in User Interfaces
 *          "authors":  [                               // Array of authord
 *              "name <mail@mhcclient.com>"
 *          ]
 *          "desc":         "mhcclient adapter",          // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       // possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   // possible values "daemon", "schedule", "subscribe"
 *          "materialize":  true,                       // support of admin3
 *          "schedule":     "0 0 * * *"                 // cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      // Adapters Log Level
 *      },
 *      "native": {                                     // the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42,
 *          "mySelect": "auto"
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.mhcclient.0
var adapter = new utils.Adapter('mhcclient');

// Other required packages
var http = require('http');     // Docs: https://nodejs.org/api/http.html
var httpserver = http.createServer(serverHandler);
httpserver.listen(7890);

var fs = require('fs');         // Docs: https://nodejs.org/api/fs.html
var moment = require('moment'); // Docs: http://momentjs.com/docs/#/displaying/format/
var xml2js = require('xml2js'); // Docs: https://github.com/Leonidas-from-XIV/node-xml2js


// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    if (typeof obj === 'object' && obj.message) {
        if (obj.command === 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
    initWebserver();
});

function main() {

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('config test1: '    + adapter.config.test1);
    adapter.log.info('config test1: '    + adapter.config.test2);
    adapter.log.info('config mySelect: ' + adapter.config.mySelect);


    /**
     *
     *      For every state in the system there has to be also an object of type state
     *
     *      Here a simple mhcclient for a boolean variable named "testVariable"
     *
     *      Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
     *
     */

    adapter.setObject('testVariable', {
        type: 'state',
        common: {
            name: 'testVariable',
            type: 'boolean',
            role: 'indicator'
        },
        native: {}
    });

    // in this mhcclient all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');


    /**
     *   setState examples
     *
     *   you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
     *
     */

    // the variable testVariable is set to true as command (ack=false)
    adapter.setState('testVariable', true);

    // same thing, but the value is flagged "ack"
    // ack should be always set to true if the value is received from or acknowledged from the target system
    adapter.setState('testVariable', {val: true, ack: true});

    // same thing, but the state is deleted after 30s (getState will return null afterwards)
    adapter.setState('testVariable', {val: true, ack: true, expire: 30});



    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', function (res) {
        console.log('check user admin pw ioboker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', function (res) {
        console.log('check group user admin group admin: ' + res);
    });

}

function initWebserver() {
    adapter.log.info("Intializing Webserver on Port " + httpserver.address().port);
}

function serverHandler(req, res) {
    var cDate = moment().format("YYYYMMDD_HHmmss");

    if(req.method == "POST") {
        res.writeHead(200, {"Content-Type": "text/plain"} );
        adapter.log.info("Received a POST request " + req.url + " from ");

        var fName = "/tmp/mhc-" + cDate;
        var xName = fName + ".xml";
        var jName = fName + ".json";

        let body = [];
        req.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            fs.writeFile(xName , body, (err) => {
                if (err) throw err;
                if (err) adapter.log.error("An error occured writing the file " + xName + ". Error: " + err);
                else adapter.log.info("Wrote file " + xName + " successfully.");
            });
            xml2js.parseString(body, (err, result) => {
                if (err) {
                  throw err;
                  adapter.log.error("An error occured writing the file " + jName + ". Error: " + err2);
                } else {
                    fs.writeFile(jName, JSON.stringify(result), (err2) => {
                        if (err2) {
                            throw err;
                            adapter.log.error("An error occured writing the file " + jName + ". Error: " + err2);
                        }
                        else adapter.log.info("Wrote file " + jName + " successfully.");
                    });

                    processMhcXmlJsRequest(result);

                }
            });
            // at this point, `body` has the entire request body stored in it as a string
        });

        res.end("Hello POST World Test " + new Date() + "\n");
    } else {
        res.writeHead(200, {"Content-Type": "text/plain"} );
        adapter.log.info("Received a " + req.method + " request " + req.url + " from ");
        res.end("Hello GET World Test " + new Date() + "\n");
    }
}

function setMucVer(mucid, mucver, mucts) {
    adapter.setObjectNotExists(
        mucid + ".VERSION",
        {
            type: "state",
            common: {role: "", name: "VERSION " + mucid},
            native: {}
        },
        function () {
            adapter.setState(mucid + ".VERSION", {val: mucver, ts: mucts});
        }
    );
}

function createSetState(stateid, statename, stateval, statets) {
    adapter.setObjectNotExists(
        stateid,
        {
            type: "state",
            common: {role: "", name: statename},
            native: {}
        },
        function () {
            adapter.setState(stateid, {val: stateval, ts: statets});
        }
    );
}

function setMeterDataSets(sdata, datachid, idata, datauser) {
    var {dval, dts} = extractEntryData(sdata.entry);
    var datascale = sdata.$.SCALE;
    if(datascale !== undefined && datascale != 0) {
        createSetState(stateidp + "RAW", "RAW", dval, dts);
        dval = dval * (datascale !== undefined && datascale != 0 ? datascale : 1);
    }
    var stateidp = datachid + ".";
    createSetState(stateidp + "SLOT", "SLOT", idata, dts);
    createSetState(stateidp + "USER", "USER", datauser, dts);
    createSetState(stateidp + "VALUE", "VALUE", dval, dts);
    createSetState(stateidp + "DESCRIPTION", "DESCRIPTION", sdata.$.DESCRIPTION, dts);
    createSetState(stateidp + "UNIT", "UNIT", sdata.$.UNIT, dts);
    createSetState(stateidp + "SCALE", "SCALE", datascale, dts);
    createSetState(stateidp + "MEDIUM", "MEDIUM", sdata.$.MEDIUM, dts);
    createSetState(stateidp + "OBIS_ID", "OBIS_ID", sdata.$.OBIS_ID, dts);
}

function processMeterDataSet(sdata, mucid, meterif, meterid, meterdata, idata) {
    var datamedium = sdata.$.MEDIUM;
    var datauser = sdata.$.USER;
    var datachid = mucid + "." + meterif + "." + meterid;
    if (meterdata.length == 1) {
        setMeterDataSets(sdata, datachid, idata, datauser)
    } else {
        datachid = datachid + "." + idata;
        adapter.setObjectNotExists(
            datachid,
            {
                type: "channel",
                common: {role: "", name: "Meter Data Set " + idata},
                native: {}
            },
            function () {
                setMeterDataSets(sdata, datachid, idata, datauser);
            }
        );
    }

    return {datauser, datachid};
}

function processMeterData(smeter, meterIdDevId, mucts, meters, ameter, mucid, meterif, meterid) {
    var meterusr = smeter.$.USER;
    var meterUsrId = meterIdDevId;
    createSetState(meterUsrId, "Meter User", meterusr, mucts)
    var meterdata = meters[ameter].data;
    for (var idata in meterdata) {
        var sdata = meterdata[idata];
        //var {datauser, datachid, entryData, datascale, dval, dts, stateidp} =
        processMeterDataSet(sdata, mucid, meterif, meterid, meterdata, idata);
    }
}

function processInterface(smeter, meterIfDevId, mucts, meters, ameter, mucid, meterif) {
    var meterid = smeter.$.METER_ID;
    var meterIdDevId = meterIfDevId + "." + meterid;
    adapter.setObjectNotExists(
        meterIdDevId,
        {
            type: "channel",
            common: {role: "", name: "Meter ID " + meterid},
            native: {}
        },
        function () {
            processMeterData(smeter, meterIdDevId, mucts, meters, ameter, mucid, meterif, meterid);
        }
    );
}

function processMeter(smeter, mucid, mucts, meters, ameter) {
    var meterif = smeter.$.INTERFACE;
    var meterIfDevId = mucid + "." + meterif;
    adapter.setObjectNotExists(
        meterIfDevId,
        {
            type: "channel",
            common: {role: "", name: "Meter Interface " + meterif},
            native: {}
        },
        function () {
            processInterface(smeter, meterIfDevId, mucts, meters, ameter, mucid, meterif);
        });
    return {meterif, meterIfDevId};
}

function processMUC(smuc) {
    var mucid = smuc.$.MUC_ID;
    var mucts = smuc.$.TIMESTAMP;
    var mucver = smuc.$.VERSION;

    var mucVerStateId = mucid + ".VERSION";

    adapter.setObjectNotExists(
        mucid,
        {
            type: "device",
            common: {role: "", name: "MUC " + mucid},
            native: {}
        },
        function () {

            setMucVer(mucid, mucver, mucts);

            var meters = smuc.meter;
            for (var ameter in meters) {
                var smeter = meters[ameter];
                //var {meterif, meterIfDevId} =
                processMeter(smeter, mucid, mucts, meters, ameter);
            }
        }
    );
    return {mucid, mucts, mucver};
}

function processMhcXmlJsRequest(result) {
    var iface = result.interface;
    var mucs = iface.muc;
    for (var amuc in mucs) {
        var smuc = mucs[amuc];
        // var {mucid, mucts, mucver} =
        processMUC(smuc);
    }
}

function extractEntryData(entries) {
    var dval = null, dts = null;
    for (var anentry in entries) {
        var params = entries[anentry].param;

        for (var aparam in params) {
            var tmp = params[aparam];
            switch (tmp.$.NAME) {
                case "T":
                    dts = tmp._;
                    break;
                case "T_MUC":
                    if (dts == null) dts = tmp._;
                    break;
                case "VAL":
                    dval = tmp._;
                    break;
                default:
                    adapter.log.warn("Wired param name " + tmp.$.NAME + " with value " + tmp._);
                    break;
            }
        }
    }
    return { dval, dts };
}