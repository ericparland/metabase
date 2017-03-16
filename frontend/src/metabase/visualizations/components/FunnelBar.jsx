/* @flow */

import React, { Component, PropTypes } from "react";
import ReactDOM from "react-dom";

import BarChart from "metabase/visualizations/visualizations/BarChart.jsx";

import { getSettings } from "metabase/visualizations/lib/settings";
import { assocIn } from "icepick";

import type { VisualizationProps } from "metabase/visualizations";

export default class BarFunnel extends Component<*, VisualizationProps, *> {
    render() {
        return (
            <BarChart
                 {...this.props}
                 isScalarSeries={true}
                 settings={{
                     ...this.props.settings,
                     ...getSettings(assocIn(this.props.series, [0, "card", "display"], "bar")),
                     "bar.scalar_series": true
                 }}
             />
        );
    }
}
