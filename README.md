# ioBroker.mhcclient
![Logo](https://github.com/the78mole/ioBroker.mhcclient/blob/master/admin/mhcclient.png?raw=true)
=====================

[![NPM version](http://img.shields.io/npm/v/iobroker.mhcclient.svg)](https://www.npmjs.com/package/iobroker.mhcclient)
[![License](http://img.shields.io/npm/l/iobroker.mhcclient.svg)](https://www.npmjs.com/package/iobroker.mhcclient)
[![Downloads](https://img.shields.io/npm/dm/iobroker.mhcclient.svg)](https://www.npmjs.com/package/iobroker.mhcclient)
[![Issues](https://img.shields.io/github/issues/badges/iobroker.mhcclient.svg)](https://www.npmjs.com/package/iobroker.mhcclient)

[![NPM](https://nodei.co/npm/iobroker.mhcclient.png?downloads=true)](https://nodei.co/npm/iobroker.mhcclient/)

This adapter is for receiving the XML push messages from MH-Collector, which 
is a Collector for M-Bus-, wM-Bus- ans S0-Sensors. You can get the MH-Collector
and a lot of measurement equipment (Liquid Flow Meters, Heat Flow Meters, 
Heat Cost Allocators, Electric Power Meters, ...) from http://www.messhelden.de.

The hardware is produced by Solvimus and is also distributed as easy.muc from 
Solvimus directly or as AHV-Collector (AlterHausVerwalter.de).
Since I don't have such available, I can not test against.

Usually the measurements are uploaded to a portal site and processed to
calculate the rental expenses. But with the new EU-law, which is known as
DSGVO in Germany, it creates many uncertainties to give out personal data of
renters to 3rd parties, especially when the data is hosted in a cloud or in an
unknown place.

Therefore, I created this adapter, to receive the measuments from the Collector,
store it in a history database (e.g. influx.db, depending on your iobroker config)
and extract the data to calculate the billing of heat, water and electricity.

To achieve this, the following settings need to be configured on the admin pages
of the collector below the **Server** tab:

| Setting        | Value              | Note                                             |
|----------------|--------------------|--------------------------------------------------|
| Mode           | XML TCP            | SSL/TLS not yet supported                        |
| Interval (min) | 5                  | your choice                                      |
| Address        | <iobroker-host>    | best to use a fixed IP                           |
| Port           | 7890               | depends on adapter config your selected          |
| Directory      | /                  | Ignored by mhcclient... All POSTs are processed. |

## Requirements

There are some other requirements for the adapter to work correctly:

Since the order of the elements in the XML files sometimes changes, it was not
possible to use this as an easy index for the channels. Therefore, the OBIS-ID
is used in the first place to create a channel and the USER string of a sensor
if no OBIS-ID is set. If none of these exists or if not unique, data could be
messed/overwritten. Therefore, I suggest to set the OBIS-ID.
  
### OBIS-IDs (not verified)

| OBIS-ID         | Unit      | Period                           | Short Description                |
|-----------------|-----------|----------------------------------|----------------------------------|
| 0-0:96.1.0*255  | -         | -                                | Serial Number / Fabrication      |
| 0-0:96.8.0*255  | h         | Actual value                     | Operating Time                   |
| 0-0:97.97.0*255 | (Bin)     | Actual value                     | Error Flags                      |
| 1-0:1.8.0*255   | Wh        | Actual value                     | Electrical Energy                |
| 4-1:1.0.0*255   | -         | Actual value                     | Heat Cost Allocator (Factor)     |
| 4-1:1.2.0*0     | -         | Billing Period 0 (last year)     | Heat Cost Allocator (Factor)     |
| 4-1:1.2.0*1     | -         | Billing Period 1 (2 years ago)   | Heat Cost Allocator (Factor)     |
| 6-0:1.0.0*255   | Wh        | Actual value                     | Thermal Energy (Heat)            |
| 6-0:0.1.10*0    | s         | Billing period 0 (last month)    | Timestamp                        |
| 6-0:0.1.10*1    | s         | Billing period 1 (2 months ago)  | Timestamp                        |
| ...             | ...       | ...                              | ...                              |
| 6-0:0.1.10*100  | s         | Billing period 100 (last year)   | Timestamp                        |
| 6-0:0.1.10*101  | s         | Billing period 101 (2 years ago) | Timestamp                        |
| 6-0:1.2.0*0     | Wh        | Billing period 0 (last month)    | Thermal Energy (Heat)            |
| 6-0:1.2.0*1     | Wh        | Billing period 1 (2 months ago)  | Thermal Energy (Heat)            |
| 6-0:1.2.0*100   | Wh        | Billing period 100 (last year)   | Thermal Energy (Heat)            |
| 6-0:1.2.0*101   | Wh        | Billing period 101 (2 years ago) | Thermal Energy (Heat)            |
| 6-0:2.0.0*255   | m^3       | Actual value                     | Volume                           |
| 6-0:8.0.0*255   | W         | Actual value                     | Power                            |
| 6-0:9.0.0*255   | m^3/h     | Actual value                     | Volume Flow                      |
| 6-0:10.0.0*255  | °C        | Actual value                     | Forward/Flow Temperature         |
| 6-0:11.0.0*255  | °C        | Actual value                     | Return Temperature               |
| 6-0:12.0.0*255  | °C, K     | Actual value                     | Temperature Difference           |
| 8-1:1.0.0*255   | m^3       | Actual value                     | Volume                           |
| 8-1:1.2.0*0     | m^3       | Billing Period 0 (last month)    | Volume                           |
| 8-1:1.2.0*1     | m^3       | Billing Period 1 (2 months ago)  | Volume                           |


Links zu OBIS-IDs:
- https://github.com/Apollon77/smartmeter-obis/blob/master/lib/ObisNames.js
- https://bit.ly/2JcqclZ

#### Billing Periods

Billing periods (the number behind the * in the OBIS-ID) is of free choice. If there is a timestamp that 
belongs to a value, they should get the same period ID. In my case, I prefer 0,1,2,3,4,... for month and 
100, 101, 102,... for years like:

    0 = end of last month
    1 = 2 month ago
    2 = 3 month ago
    ...
    100 = end last year
    101 = 2 years ago
    ...

## Testing

The adapter can be tested without a MH-Collector by using one of the example
files with curl:

    curl -X POST @<FILENAME> http://<HOST>:<PORT>/
    
    curl -X POST @examples/testfile.xml http://localhost:7890/
    
## Releases

### 0.0.2 - 0.0.5
* (the78mole) some fixes in README.md and irgnores 

### 0.0.1
* (the78mole) initial release

## License
The MIT License (MIT)

Copyright (c) 2018 Daniel Glaser <the78mole@chaintronics.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
