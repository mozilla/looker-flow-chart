constant: vis_id {
    value: "flow-chart"
    export: override_optional
}
constant: vis_label {
    value: "Flow Chart"
    export: override_optional
}
visualization: {
    id: "@{vis_id}"
    label: "@{vis_label}"
    file: "dist/flowChart.js"
    dependencies: []
}
