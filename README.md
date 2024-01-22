# Looker Flow Chart

Looker visualization for flow data analysis. 

![Flow chart screenshot](https://github.com/mozilla/looker-flow-chart/raw/main/docs/screenshot.png)

## Usage

Select "Flow Chart" as the visualization in Looker. 
The general structure of the results data is expected to have different nodes and links in between these nodes. 
The weight/value of these links can vary. Additionally, traces across the visualized graph can be grouped into flows.

The visualization expects 4 fields in the results data:
* Source Field: starting node
* Target Field: target node
* Weight Field: value associated with the link that is represented through the source-target field pair
* Flow Field: ID or unique value to indicate that the link belongs to a specific flow. A flow usually consists of multiple links

![Flow chart settings](https://github.com/mozilla/looker-flow-chart/raw/main/docs/settings.png)

Additional configuration options to change to color and style of the flow chart, as well as tooltips are available in the "Series" tab.

## Development

Install dependencies: `npm install`

To build the visualization plugin run: `npm run build`

Any changes to the source code will be automatically detected.

## Testing

To test local changes run `npm run start`

All changes made locally will be reflected when selecting the _Flow Chart - Development_ visualization.

This visualization has been configured by adding a new _Visualization_ through the Admin interface and setting the entry point to `https://localhost:3443/flowChart.js`

In some cases the dev visualization might fail to load with `ERR_CERT_AUTHORITY_INVALID`. This can be fixed by opening `https://localhost:3443/flowChart.js` in a browser and accepting the risk that the certificate might not be valid.

## Installation

To install this plugin in Looker for use in production, go to _Marketplace_ → _Manage_ → _Install via git URL_:

* Git Repository URL: `https://github.com/mozilla/looker-flow-chart.git`
* Git Commit SHA: `main`

## Updating

Whenever changes have been pushed to the git repository, the plugin needs to be manually updated in Looker.
Go to _Marketplace_ → _Manage_ and click on the settings icon of the installed plugin. Click _Update_ to install updates.
