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
var fs = require('fs');         // Docs: https://nodejs.org/api/fs.html
var path = require('path');
var proc = require('process');
var utils;

if (proc.argv && proc.argv[1]) {
    console.log('Proc Argv[1] : ' + proc.argv[1]);
    var scriptcl = proc.argv[1];
    console.log('scriptcl : ' + scriptcl);
    var scriptdir = path.dirname(scriptcl);
    console.log('scriptdir : ' + scriptdir);
    utils = require(scriptdir + '/lib/utils');
} else {
    utils = require(__dirname + '/lib/utils'); // Get common adapter utils
}

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.mhcclient.0
var adapter = new utils.Adapter('mhcclient');

// Other required packages
var http = require('http');     // Docs: https://nodejs.org/api/http.html
var httpenabled;
var httpport, httphost;
var httpserver;
var xmlpath, jsonpath;
var enablexml, enablejson;

var moment = require('moment'); // Docs: http://momentjs.com/docs/#/displaying/format/
var xml2js = require('xml2js'); // Docs: https://github.com/Leonidas-from-XIV/node-xml2js
var mkdirp = require('mkdirp'); // Docs: https://www.npmjs.com/package/mkdirp

var interfaces = {
    '01': 'S0-Bus',
    '02': 'M-Bus',
    '05': 'wM-Bus'
}


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
	// Disabled logging because it creates quite extensive logging already 
	// with only a few meters connected to the collector
    // Warning, state can be null if it was deleted
    // adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    //if (state && !state.ack) {
    //    adapter.log.info('ack is not set!');
    //}
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
});

function main() {

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('HTTP server port: '    + adapter.config.port);
    adapter.log.info('HTTP server host: '    + adapter.config.bind);
    adapter.log.info('XML  log path [' + (adapter.config.output.xml.enable ? 'X' : '-') + ']: '    + adapter.config.output.xml.path);
    adapter.log.info('JSON log path [' + (adapter.config.output.json.enable ? 'X' : '.') + ']: '    + adapter.config.output.json.path);

    console.log('HTTP server port : '    + adapter.config.port);
    console.log('HTTP server host : '    + adapter.config.bind);
    console.log('XML  log path [' + (adapter.config.output.xml.enable ? 'X' : '-') + ']: '    + adapter.config.output.xml.path);
    console.log('JSON log path [' + (adapter.config.output.json.enable ? 'X' : '.') + ']: '    + adapter.config.output.json.path);

    console.log(JSON.stringify(adapter.config));

    httpenabled = adapter.config.enabled || false;
    httpport = adapter.config.port || 7890;
    httphost = adapter.config.bind || '0.0.0.0';
    xmlpath  = adapter.config.output.xml.path || '/var/data/xml';
    jsonpath = adapter.config.output.json.path || '/var/data/json';
    enablexml = adapter.config.output.xml.enable || false;
    enablejson = adapter.config.output.json.enable || false;

    // Create the directories if enabled
    if (adapter.config.output) {
        adapter.log.info("Looping throug log dir paths.");

        var arr = [ adapter.config.output.xml, adapter.config.output.json ];
        arr.forEach(function(item) {
            if (item && item.enable && item.path) {
                if(fs.statSync(item.path).isDirectory) {
                    adapter.log.info("Directory " + item.path + " already exists. OK.");
                } else {
                    adapter.log.info("Directory " + item.path + " will be created.");
                    mkdirp(item.path, function (err) {
                        if (err) {
                            adapter.log.error("Could not create directory " + item.path);
                        } else {
                            adapter.log.info("Directory " + item.path + " created.");
                        }
                    });
                }
            }
        });

/*        for (var apath in [adapter.config.output.xml, adapter.config.output.json]) {
            var aconfig = adapter.config.output[apath];
            adapter.log.info("Checking directory " + aconfig.path + " exists or needs to be created.");
            if (aconfig && aconfig.enable && aconfig.path) {
                mkdirp(aconfig.path, function (err) {
                    if (err) {
                        adapter.log.error("Could not create directory " + aconfig.path);
                    } else {
                        adapter.log.info("Directory " + aconfig.path + " created or exists.");
                    }
                });
            } else {
                adapter.log.info("Not creating directory " + aconfig.path
                    + " (" + (aconfig ? "O" : "-") + (aconfig.enable ? "E" : "-") + (aconfig.path ? "P" : "-") + ")");
            }
        }
*/
    } else {
        adapter.log.warning("Could not find the output config part.");
    }

    // in this mhcclient all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', function (res) {
        console.log('check user admin pw ioboker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', function (res) {
        console.log('check group user admin group admin: ' + res);
    });

    if (httpenabled) {
        httpserver = http.createServer(serverHandler);
        httpserver.listen(httpport, httphost);
    }
}

function serverHandler(req, res) {
    var cDate = moment().format("YYYYMMDD_HHmmss");

    if(req.method == "POST") {
        res.writeHead(200, {"Content-Type": "application/xml"} );
        console.log("Received a POST request " + req.url + " from ");
        adapter.log.info("Received a POST request " + req.url + " from ");

        var fName = "mhc_" + cDate;
        var xName = xmlpath + "/" + fName + ".xml";
        var jName = jsonpath + "/" + fName + ".json";

        var body = [];
        req.on('data', (chunk) => {
//            console.log("-> Server req on_data called.");
            body.push(chunk);
        }).on('end', () => {
            console.log("   -> Server req on_end called.");
            console.log("<- End response");
            res.end("\n");
            body = Buffer.concat(body).toString();
            if (xmlpath && enablexml) {
                fs.writeFile(xName, body, (err) => {
                    if (err) throw err;
                    if (err) adapter.log.error("An error occured writing the file " + xName + ". Error: " + err);
                    else adapter.log.info("Wrote file " + xName + " successfully.");
                });
            }
            xml2js.parseString(body, (err, result) => {
                if (err) {
                  throw err;
                  adapter.log.error("An error occured writing the file " + jName + ". Error: " + err2);
                } else {
                    if (jsonpath && enablejson) {
                        fs.writeFile(jName, JSON.stringify(result), (err2) => {
                            if (err2) {
                                throw err;
                                adapter.log.error("An error occured writing the file " + jName + ". Error: " + err2);
                            }
                            else adapter.log.info("Wrote file " + jName + " successfully.");
                        });
                    }

                    processMhcXmlJsRequest(result);

                }
            });
            // at this point, `body` has the entire request body stored in it as a string
        });

//        console.log("<- End response");
//        res.end("\n");
//        res.end("Hello POST World Test " + new Date() + "\n");
    } else {
        res.writeHead(200, {"Content-Type": "text/plain"} );
        adapter.log.info("Received a " + req.method + " request " + req.url + " from ");
        res.end("Hello " + req.method + " World Test " + new Date() + "\n");
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
            adapter.setState(mucid + ".VERSION", {val: mucver, ts: mucts, ack: true});
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
            adapter.setState(stateid, {val: stateval, ts: statets}, true);
        }
    );
}

function setMeterDataSets(sdata, datachid, idata, datauser) {
    var {dval, dts} = extractEntryData(sdata.entry);
    var datascale = sdata.$.SCALE;
    var stateidp = datachid + ".";
    if(datascale) {
        createSetState(stateidp + "RAW", "RAW", dval, dts);
        dval = dval * (datascale !== undefined && datascale != 0 ? datascale : 1);
    }
    createSetState(stateidp + "SLOT", "SLOT", idata, dts);
    createSetState(stateidp + "USER", "USER", datauser, dts);
    createSetState(stateidp + "VALUE", "VALUE", dval, dts);
    createSetState(stateidp + "DESCRIPTION", "DESCRIPTION", sdata.$.DESCRIPTION, dts);
    createSetState(stateidp + "UNIT", "UNIT", sdata.$.UNIT, dts);
    createSetState(stateidp + "SCALE", "SCALE", datascale, dts);
    createSetState(stateidp + "MEDIUM", "MEDIUM", sdata.$.MEDIUM, dts);
    createSetState(stateidp + "OBIS_ID", "OBIS_ID", sdata.$.OBIS_ID, dts);
    var retval;
    var noPrecision = [ 'None', 'UTC', 'Bin' ];
    var noUnit = [ 'None' ];
    var dunit = sdata.$.UNIT;

    if (typeof dval == 'number')
        dval = (noPrecision.indexOf(dunit) > -1 ? dval : dval.toPrecision(5));
    retval = { val: dval + (noUnit.indexOf(dunit) > -1 ? "" : " " + dunit), ts: dts };

    return retval;
}

function processMeterDataSet(sdata, mucid, meterif, meterid, meterdata, idata) {
    var datamedium = sdata.$.MEDIUM;
    var datauser = sdata.$.USER;
    var datachid = mucid + "." + meterif + "." + meterid;
    var addid;
    var chrole = '';
    if (sdata.$.UNIT && sdata.$.UNIT != 'None') {
        chrole = 'sensor';
    }

    if (sdata.$.OBIS_ID) {
        addid = sdata.$.OBIS_ID.replace(/[ -\/^:;.]/g, '_');
    }
    else if (sdata.$.USER) {
        addid = sdata.$.USER.replace(/[ -\/^:;.]/g, '_');
    }
    else if (sdata.$.DESCRIPTION) {
        addid = sdata.$.DESCRIPTION.replace(/[ -\/^:;.]/g, '_');
    }

    var fullid = datachid + "." + addid;

    adapter.setObjectNotExists(
        fullid,
        {
            type: "channel",
            common: {role: chrole, name: "Meter Data Set " + idata },
            native: {}
        },
        function () {
            /* var {dval, dts} = extractEntryData(sdata.entry);
            var datascale = sdata.$.SCALE;
            if(datascale) {
                dval = dval * (datascale ? datascale : 1);
            }
            createSetState(datachid, addid, dval, dts); */ 
            //console.log(JSON.stringify(arguments));
            var retval = setMeterDataSets(sdata, fullid, idata, datauser);
            if (retval) adapter.setState(fullid, retval, false);
        }
    );

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

function lookupIf(busid) {
    return interfaces[busid];
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
            var ifdescval = lookupIf(smeter.$.INTERFACE);
            if(ifdescval)
                adapter.setState(meterIfDevId, { val: ifdescval });
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