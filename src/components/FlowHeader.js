import React, { Component } from "react";
import { Segment } from "semantic-ui-react";

//
// this component is the tab panel wrapper for the console content
//
export default class FlowHeader extends Component {
  constructor(props) {
    super(props);

    this.name = "[FlowHeader]";
  }

  /// renders the journal items component from array in the console view
  render() {
    return (
      <div
        id="component"
        className="flowHeader"
        style={{ height: this.props.height }}
      >
        <Segment inverted>
          <h3>{this.props.member}'s Flow</h3>
        </Segment>
      </div>
    );
  }
}
