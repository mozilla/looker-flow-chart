import graph_objects from 'plotly.js';

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
  },

  create (element, config) {
    // TODO: styles in here?
    // TODO: move some general setup to this fn?

    
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
    const sourceObj = [...queryResponse.fields.dimension_like, ...queryResponse.fields.measure_like].filter(f => f.name === config.source);
    let sourceType = "";
    if (sourceObj.length > 0) {
      sourceType = xObj[0].type;
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

    const ctxElem = `<canvas id="vis-chart" width="${width}" height="${height}"></canvas>`;
    element.innerHTML = ctxElem;
    this.ctx = document.getElementById('vis-chart');

    const nodes = d3data.flatMap((d) => {
      return [d.source, d.target]
    });
    const labels = nodes.filter((value, index, array) => array.indexOf(value) === index);
    const sources = d3data.flatMap((d) => {
      return labels.indexOf(d.source)
    });
    const targets = d3data.flatMap((d) => {
      return labels.indexOf(d.target)
    });
    const weights = d3data.flatMap((d) => {
      return d.weight
    });
    const flows = d3data.flatMap((d) => {
      return d.flow
    });

    var data = {
      type: "sankey",
      orientation: "h",
      node: {
        pad: 15,
        thickness: 30,
        line: {
          color: "black",
          width: 0.5
        },
    
        label: labels,
      //  color: ["blue", "blue", "blue", "blue", "blue", "blue"]
    
      },
    
      link: {
        source: sources,
        target: targets,
        value: weights,
        label: flows
      }
    }
    
    var data = [data]
    
    var layout = {
      font: {
        size: 10
      }
    }
    
    const chart = Plotly.react(this.ctx, data, layout);

    done();
  },
};

looker.plugins.visualizations.add(vis);
