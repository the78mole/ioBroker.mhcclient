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
| **General**     |           |                                  |                                  |
| a-b:c.d.e*f     |           |                                  |                                  |
| ---             | ---       | ---                              | ---                              |
| **Abstract Objects** |      |                                  |                                  |
| 0-0:96.1.0*255  | -         | -                                | Serial Number / Fabrication      |
| 0-0:96.8.0*255  | h         | Actual value                     | Operating Time                   |
| 0-0:97.97.0*255 | (Bin)     | Actual value                     | Error Flags                      |
| ---             | ---       | ---                              | ---                              |
| **Electricity** | | ([details for **d**](https://github.com/Apollon77/smartmeter-obis/blob/master/lib/ObisNames.js#L407)) | |
| 1-0:1.7.0*255   | W         | Actual value                     | Electrical Power (Total +)       |
| 1-0:1.8.0*255   | Wh        | Actual value                     | Electrical Energy (Total +)      |
| 1-0:2.7.0*255   | W         | Actual value                     | Electrical Power (Total -)       |
| 1-0:2.8.0*255   | Wh        | Actual value                     | Electrical Energy (Total -)      |
| 1-0:3.7.0*255   | var       | Actual value                     | Reactive Power (Total +)         |
| 1-0:3.8.0*255   | varh      | Actual value                     | Reactive Energy (Total +)        |
| 1-0:4.7.0*255   | var       | Actual value                     | Reactive Power (Total -)         |
| 1-0:4.8.0*255   | varh      | Actual value                     | Reactive Energy (Total -)        |
| 1-0:5.7.0*255   | var       | Actual value                     | Reactive Power (Total Q I)       |
| 1-0:5.8.0*255   | varh      | Actual value                     | Reactive Energy (Total Q I)      |
| 1-0:6.7.0*255   | var       | Actual value                     | Reactive Power (Total Q II)      |
| 1-0:6.8.0*255   | varh      | Actual value                     | Reactive Energy (Total Q II)     |
| 1-0:7.7.0*255   | var       | Actual value                     | Reactive Power (Total Q III)     |
| 1-0:7.8.0*255   | varh      | Actual value                     | Reactive Energy (Total Q III)    |
| 1-0:8.7.0*255   | var       | Actual value                     | Reactive Power (Total Q IV)      |
| 1-0:8.8.0*255   | varh      | Actual value                     | Reactive Energy (Total Q IV)     |
| 1-0:9.7.0*255   | VA        | Actual value                     | Apparent Power (Total +)         |
| 1-0:9.8.0*255   | VAh       | Actual value                     | Apparent Energy (Total +)        |
| 1-0:10.7.0*255  | VA        | Actual value                     | Apparent Power (Total -)         |
| 1-0:10.8.0*255  | VAh       | Actual value                     | Apparent Energy (Total -)        |
| 1-0:11.6.0*255  | A         | Actual value                     | Current                          |
| 1-0:12.7.0*255  | V         | Actual value                     | Voltage                          |
| 1-0:13.7.0*255  | -         | Actual value                     | Power Factor                     |
| 1-0:14.7.0*255  | Hz        | Actual value                     | Frequency                        |
| 1-0:16.7.0*255  | Wh        | Actual value                     | Total Active Power               |
| 1-0:21.7.0*255  | Wh        | Actual value                     | L1 Active Power (+)              |
| 1-0:22.7.0*255  | Wh        | Actual value                     | L1 Active Power (-)              |
| 1-0:23.7.0*255  | varh      | Actual value                     | L1 Reactive Power (+)            |
| 1-0:24.7.0*255  | varh      | Actual value                     | L1 Reactive Power (-)            |
| 1-0:25.7.0*255  | varh      | Actual value                     | L1 Reactive Power (Q I)          |
| 1-0:26.7.0*255  | varh      | Actual value                     | L1 Reactive Power (Q II)         |
| 1-0:27.7.0*255  | varh      | Actual value                     | L1 Reactive Power (Q III)        |
| 1-0:28.7.0*255  | varh      | Actual value                     | L1 Reactive Power (Q IV)         |
| 1-0:29.7.0*255  | VAh       | Actual value                     | L1 Apparent Power (+)            |
| 1-0:30.7.0*255  | VAh       | Actual value                     | L1 Apparent Power (-)            |
| 1-0:31.7.0*255  | A         | Actual value                     | L1 Current                       |
| 1-0:32.7.0*255  | V         | Actual value                     | L1 Voltage                       |
| 1-0:33.7.0*255  | -         | Actual value                     | L1 Power Factor                  |
| 1-0:34.7.0*255  | V         | Actual value                     | L1_L2 Voltage ***non-standard*** |
| 1-0:41.7.0*255  | Wh        | Actual value                     | L2 Active Power (+)              |
| 1-0:42.7.0*255  | Wh        | Actual value                     | L2 Active Power (-)              |
| 1-0:43.7.0*255  | varh      | Actual value                     | L2 Reactive Power (+)            |
| 1-0:44.7.0*255  | varh      | Actual value                     | L2 Reactive Power (-)            |
| 1-0:45.7.0*255  | varh      | Actual value                     | L2 Reactive Power (Q I)          |
| 1-0:46.7.0*255  | varh      | Actual value                     | L2 Reactive Power (Q II)         |
| 1-0:47.7.0*255  | varh      | Actual value                     | L2 Reactive Power (Q III)        |
| 1-0:48.7.0*255  | varh      | Actual value                     | L2 Reactive Power (Q IV)         |
| 1-0:49.7.0*255  | VAh       | Actual value                     | L2 Apparent Power (+)            |
| 1-0:50.7.0*255  | VAh       | Actual value                     | L2 Apparent Power (-)            |
| 1-0:51.7.0*255  | A         | Actual value                     | L2 Current                       |
| 1-0:52.7.0*255  | V         | Actual value                     | L2 Voltage                       |
| 1-0:53.7.0*255  | -         | Actual value                     | L2 Power Factor                  |
| 1-0:54.7.0*255  | V         | Actual value                     | L2_L3 Voltage ***non-standard*** |
| 1-0:61.7.0*255  | Wh        | Actual value                     | L3 Active Power (+)              |
| 1-0:62.7.0*255  | Wh        | Actual value                     | L3 Active Power (-)              |
| 1-0:63.7.0*255  | varh      | Actual value                     | L3 Reactive Power (+)            |
| 1-0:64.7.0*255  | varh      | Actual value                     | L3 Reactive Power (-)            |
| 1-0:65.7.0*255  | varh      | Actual value                     | L3 Reactive Power (Q I)          |
| 1-0:66.7.0*255  | varh      | Actual value                     | L3 Reactive Power (Q II)         |
| 1-0:67.7.0*255  | varh      | Actual value                     | L3 Reactive Power (Q III)        |
| 1-0:68.7.0*255  | varh      | Actual value                     | L3 Reactive Power (Q IV)         |
| 1-0:69.7.0*255  | VAh       | Actual value                     | L3 Apparent Power (+)            |
| 1-0:70.7.0*255  | VAh       | Actual value                     | L3 Apparent Power (-)            |
| 1-0:71.7.0*255  | A         | Actual value                     | L3 Current                       |
| 1-0:72.7.0*255  | V         | Actual value                     | L3 Voltage                       |
| 1-0:73.7.0*255  | -         | Actual value                     | L3 Power Factor                  |
| 1-0:74.7.0*255  | V         | Actual value                     | L3_L1 Voltage ***non-standard*** |
| 1-0:81.7.0*255  | ° ?       | Actual value                     | Angles                           |
| 1-0:82.7.0*255  | -         | Actual value                     | Unitless Quantity                |
| 1-0:91.7.0*255  | A         | Actual value                     | Neutral Current                  |
| 1-0:92.7.0*255  | V         | Actual value                     | Neutral Voltage                  |
| 1-0:94.x.0*255  | -         | Actual value                     | Country Specific Identifier      |
| 1-0:96.x.0*255  | (Bin)     | Actual value                     | Service Entry                    |
| 1-0:96.50.0*0   | (Bin)     | Actual value                     | - Net Status                     |
| 1-0:97.8.0*255  | (Bin)     | Actual value                     | Error Message                    |
| 1-0:98.8.0*255  | ?         | Actual value                     | List                             |
| 1-0:99.8.0*255  | ?         | Actual value                     | Data profiles, Load Profiles P.01/P.02, Operation Log P.98/P.99 |
| ---             | ---       | ---                              | ---                              |
| **Thermal**     |           |                                  |                                  |
| 4-1:1.0.0*255   | -         | Actual value                     | Heat Cost Allocator (Factor)     |
| 4-1:1.2.0*0     | -         | Billing Period 0 (last year)     | Heat Cost Allocator (Factor)     |
| 4-1:1.2.0*1     | -         | Billing Period 1 (2 years ago)   | Heat Cost Allocator (Factor)     |
| ---             | ---       | ---                              | ---                              |
| **Cooling**     |           |                                  |                                  |
| 5-b:c.d.e*f     | -         | -                                | -                                |
| ---             | ---       | ---                              | ---                              |
| **Heating**     |           |                                  |                                  |
| 6-0:1.0.0*255   | Wh        | Actual value                     | Thermal Energy (Heat)            |
| 6-0:0.1.10*0    | s         | Billing period 0 (last month)    | Timestamp                        |
| 6-0:0.1.10*1    | s         | Billing period 1 (2 months ago)  | Timestamp                        |
| 6-0:70.0.0*255  | (Bin)     | Actual value                     | Condition                        |
| 6-0:96.0.0*255  | (Bin)     | Actual value                     | Service Entry                    |
| 6-0:97.0.0*255  | (Bin)     | Actual value                     | Error Flags                      |
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
| ---             | ---       | ---                              | ---                              |
| **Gas**         |           |                                  |                                  |
| 7-b:c.d.e*f     |           |                                  |                                  |
| 7-10:c.d.e*f    |           |                                  | Balancing Caloric Value          |
| 7-20:c.d.e*f    |           |                                  | Accounting Caloric Value         |
| 7-b:70.d.e*f    |           |                                  | Condition                        |
| 7-b:99.d.e*f    |           |                                  | Profile Values                   |
| ---             | ---       | ---                              | ---                              |
| **Cold Water**  |           |                                  |                                  |
| 8-1:1.0.0*255   | m^3       | Actual value                     | Volume                           |
| 8-1:1.2.0*0     | m^3       | Billing Period 0 (last month)    | Volume                           |
| 8-1:1.2.0*1     | m^3       | Billing Period 1 (2 months ago)  | Volume                           |
| ---             | ---       | ---                              | ---                              |
| **Warm Water**  |           |                                  |                                  |
| 9-b:c.d.e*f     | -         | -                                | -                                |
| ---             | ---       | ---                              | ---                              |
| **Oil**         |           |                                  |                                  |
| 16-b:c.d.e*f    | -         | -                                | -                                |
| ---             | ---       | ---                              | ---                              |
| **Compressed Air** |        |                                  |                                  |
| 17-b:c.d.e*f    | -         | -                                | -                                |
| ---             | ---       | ---                              | ---                              |
| **Nitrogen**    |           |                                  |                                  |
| 18-b:c.d.e*f    | -         | -                                | -                                |
| ---             | ---       | ---                              | ---                              |
| **Cooling**     |           |                                  |                                  |
| 5-b:c.d.e*f     | -         | -                                | -                                |

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

### 0.1.2
* (the78mole) OBIS-ID heavily extended in README

### 0.1.0 - 0.1.1
* (the78mole) npm version fixes

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
