import Plotly from 'plotly.js-dist-min';

const vis = {
  options: {
    // Plot
    source: {
      section: "Plot",
      type: "string",
      label: "Source Field",
      display: "select",
      order: 0,
      values: [],
    },
    target: {
      section: "Plot",
      type: "string",
      label: "Target Field",
      display: "select",
      order: 1,
      values: [],
    },
    flow: {
      section: "Plot",
      type: "string",
      label: "Flow Field",
      display: "select",
      order: 3,
      values: [],
    },
    weight: {
      section: "Plot",
      type: "string",
      label: "Weight Field",
      display: "select",
      order: 4,
      values: [],
    },
    // Series
    color_palette: {
      section: "Series",
      type: "array",
      label: "Color Palette",
      display: "colors",
      order: 1,
      default: [ // these are the defaults from Looker
        '#3FE1B0',
        '#0060E0',
        '#9059FF',
        '#B933E1',
        '#FF2A8A',
        '#FF505F',
        '#FF7139',
        '#FFA537',
        '#005E5D',
        '#073072',
        '#7F165B',
        '#A7341F',
      ]
    },
    show_arrows: {
      section: "Series",
      type: "boolean",
      label: "Show Links as Arrows",
      display: "toggle",
      order: 2,
      default: true
    },
    link_tooltip_format: {
      section: "Series",
      type: "string",
      label: "Link Tooltip Format",
      display: "text",
      order: 3,
      placeholder: '%{source.label} → %{target.label}<br />'+
      'Flow: %{label}<br />'+
      'Value: %{value}',
    },
    node_tooltip_format: {
      section: "Series",
      type: "string",
      label: "Node Tooltip Format",
      display: "text",
      order: 3,
      placeholder: '%{label} <br />Total count: %{value} <br />Incoming Flows: <extra></extra>',
    }
  },

  create (element, config) {

  },

  updateAsync (data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Throw some errors and exit if the shape of the data isn't what this chart needs.
    // TODO: more error checks
    if (queryResponse.fields.dimension_like.length === 0) {
      this.addError({
        title: "No Dimensions",
        message: "This chart requires dimensions.",
      });
      return;
    }
    if (queryResponse.fields.measure_like.length < 1) {
      this.addError({
        title: "Not Enough Measures",
        message: "This chart requires one measure for flow weights.", // todo: make optional
      });
      return;
    }

    // Fill in select options based on fields available
    const dim_options = queryResponse.fields.dimension_like.map(d => ({ [`${d.label_short}`]: `${d.name}` }));
    const measure_options = queryResponse.fields.measure_like.map(d => ({ [`${d.label_short ? d.label_short: d.label}`]: `${d.name}` }));

    let pivots = [];
    if ('pivots' in queryResponse) {
      pivots = queryResponse.pivots.map(d => ({ [`${d.label_short}`]: `${d.name}` }));
    }

    if (pivots.length > 0) {
      this.addError({
        title: "Pivots not supported",
        message: "Pivoting is not supported in this chart type.",
      });
      return;
    }

    // create map from full name to friendly/short name for fields
    const optionsToFriendly = {};
    [...queryResponse.fields.dimension_like, ...queryResponse.fields.measure_like].forEach(d => {
      if (d.label_short != undefined) {
        optionsToFriendly[d.name] = d.label_short;
      } else {
        optionsToFriendly[d.name] = d.label;
      }
    });

    // setup config options and default values
    this.options.source.values = dim_options;
    this.options.target.values = dim_options;
    this.options.flow.values = dim_options;
    this.options.weight.values = measure_options;

    // TODO: dynamically get the correct fields from the data
    // 	(the user should be able to select these fields from the Gear menu
    //	 and we retrieve them here)
    if (!(config.source && config.target && config.flow && config.weight)) {
      config.source = config.source || Object.values(dim_options[0])[0];
      config.target = config.target || Object.values(dim_options[1])[0];
      config.flow = config.flow || Object.values(dim_options[2])[0];
      config.weight = config.weight || Object.values(measure_options[0])[0];
    }

    const d3data = data.flatMap((row) => {
        return {
          source: row[config.source].value,
          target: row[config.target].value,
          flow: row[config.flow].value,
          weight: row[config.weight].value,
        }
    });

    // register options with parent page to update visConfig
    this.trigger('registerOptions', this.options);

    // setup canvas
    const width = element.clientWidth;
    const height = element.clientHeight;

    const colorPalette = this.options.color_palette;

    function getLinkColor(linkId) {
      if (typeof colorPalette.default !== 'undefined') {
        return colorPalette.default[linkId % colorPalette.default.length];
      }

      return "light gray";
    }

    const flows = d3data.flatMap((d) => {
      return d.flow
    });
    const uniqueFlows = flows.filter((value, index, array) => array.indexOf(value) === index);

    var deselectedItems = new Set();

    function getData() {
      const visibleFlows = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return d.flow
        } 
      });

      const nodes = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return [d.source, d.target]
        } 
      });
      const labels = nodes.filter((value, index, array) => array.indexOf(value) === index);
      const sources = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return labels.indexOf(d.source)
        } 
      });
      const targets = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return labels.indexOf(d.target)
        } 
      });
      const weights = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return d.weight
        } 
      });

      const linkColors = d3data.flatMap((d) => {
        if (deselectedItems.has(d.flow)) {
          return [];
        } else {
          return getLinkColor(uniqueFlows.indexOf(d.flow))
        }
      });

      var data = {
        type: "sankey",
        orientation: "h",
        arrangement: 'snap',

        node: {
          pad: 15,
          thickness: 50,  
          label: labels,
          color: "gray",
          hovertemplate: !!!config.node_tooltip_format ? 
            '%{label} <br />Total count: %{value} <br />Incoming Flows: <extra></extra>' : 
            config.node_tooltip_format,
        },
      
        link: {
          arrowlen: config.show_arrows ? 15 : 0,
          source: sources,
          target: targets,
          value: weights,
          label: visibleFlows,
          color: linkColors,
          hovertemplate: !!!config.link_tooltip_format ? 
          '%{source.label} → %{target.label}<br />'+
          'Flow: %{label}<br />'+
          'Value: %{value}' :
          config.link_tooltip_format,
        }
      }

      var legend = uniqueFlows.flatMap((flow) => {
        return {
          x: [null], 
          y: [null],
          type: 'scatter',
          mode: 'markers',
        
          marker: {
            color: getLinkColor(uniqueFlows.indexOf(flow)),
            size: 10,
          },
          name: flow,
          visible: deselectedItems.has(flow) ? "legendonly" : true
        }
      });
      
      var data = [data];
      var data = data.concat(legend);
      return data;
    } 
    
    var layout = {
      font: {
        size: 10
      },
      xaxis: {visible: false},
      yaxis: {visible: false},
      showlegend: true,
		  legend: {"orientation": "h"}
    }

    redrawPlot();
   
    function redrawPlot() {
      Plotly.newPlot("vis", getData(), layout);
      var plot = document.getElementById('vis');

      plot.on('plotly_restyle', function(e){
          let flow = uniqueFlows[e[1] - 1];

          if (e[0]["visible"][0] == true) {
            // show trace
            deselectedItems.delete(flow);
          } else {
            // hide trace
            deselectedItems.add(flow);
          }

          redrawPlot();
      
      });
    }

    done();
  },
};

looker.plugins.visualizations.add(vis);
