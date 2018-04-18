![Logo](admin/mhcclient.png)
# ioBroker.mhcclient
=================

This adapter is for receiving the XML push messages from MH-Collector, which 
is a Collector for M-Bus-, wM-Bus- ans S0-Sensors. You can get the MH-Collector
and a lot of measurement equipment (Liquid Flow Meters, Heat Flow Meters, 
Heat Cost Allocators, Electric Power Meters, ...) from http://www.messhelden.de.

Usually the measurements are uploaded to their portal site and processed to
calculate the rental expenses. But with the new EU-law, which is known as
DSGVO in Germany, it creates many uncertainties to give out personal data of
renters to 3rd parties, especially when the data is hosted in a cloud or in an
unknown place.

Therefore, I creeated this adapter, to receive the measuments from the Collector,
store it in a history database (e.g. influx.db, depending on your iobroker config)
and extract the data to calculate the billing of heat, water and electricity.

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
