import React, { Component } from "react";
import { Segment } from "semantic-ui-react";

//
// this component is the tab panel wrapper for the console content
//
export default class JournalItems extends Component {
  constructor(props) {
    super(props);

    this.name = "[JournalHeader]";
  }

  /// renders the journal items component from array in the console view
  render() {
    return (
      <div
        id="component"
        className="journalHeader"
        // style={{ height: this.props.height }}
      >
        <Segment inverted>
          <h3>{this.props.member}'s Torchie Journal</h3>
        </Segment>
      </div>
    );
  }
}
