import React, { Component } from "react";
import { Grid } from "semantic-ui-react";
import JournalItem from "./JournalItem";
import { DataModelFactory } from "../../models/DataModelFactory";
import { SpiritModel } from "../../models/SpiritModel";
import { JournalModel } from "../../models/JournalModel";
import { DimensionController } from "../../controllers/DimensionController";

//
// this component is the tab panel wrapper for the console content
//
export default class JournalItems extends Component {
  constructor(props) {
    super(props);

    this.name = "[JournalItems]";

    this.state = {
      journalItems: [],
      activeJournalItem: null
    };

    this.journalModel = DataModelFactory.createModel(
      DataModelFactory.Models.JOURNAL,
      this
    );

    this.spiritModel = DataModelFactory.createModel(
      DataModelFactory.Models.SPIRIT,
      this
    );

    document.onkeydown = this.handleKeyPress;
  }

  componentDidMount() {
    this.journalModel.registerListener(
      "journalItems",
      JournalModel.CallbackEvent.JOURNAL_HISTORY_UPDATE,
      this.onJournalHistoryUpdate
    );

    this.journalModel.registerListener(
      "journalItems",
      JournalModel.CallbackEvent.ACTIVE_ITEM_UPDATE,
      this.onActiveItemUpdate
    );

    this.spiritModel.registerListener(
      "journalItems",
      SpiritModel.CallbackEvent.DIRTY_FLAME_UPDATE,
      this.onDirtyFlameUpdate
    );

    this.onJournalHistoryUpdate();
  }

  onJournalHistoryUpdate = () => {
    this.setState({
      journalItems: this.journalModel.getActiveScope().allJournalItems,
      activeJournalItem: this.journalModel.getActiveScope().activeJournalItem
    });
    this.scrollToBottomOrActive();
  };

  onActiveItemUpdate = () => {
    this.setState({
      activeJournalItem: this.journalModel.getActiveScope().activeJournalItem
    });
  };

  componentWillUnmount() {
    this.spiritModel.unregisterAllListeners("journalItems");
    this.journalModel.unregisterAllListeners("journalItems");
  }

  onDirtyFlameUpdate = () => {
    console.log(this.name + " - onDirtyFlameUpdate");

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    let journalModel = this.journalModel.getActiveScope();
    let spiritModel = this.spiritModel.getActiveScope();

    let activeJournalItem = journalModel.activeJournalItem;
    let dirtyFlame = spiritModel.dirtyFlame;

    this.timeout = setTimeout(function() {
      journalModel.updateFlameRating(activeJournalItem, dirtyFlame);
    }, 500);
  };

  scrollToBottomOrActive = () => {
    if (this.state.activeJournalItem) {
      let activeRowId = this.state.activeJournalItem.id;

      let rowObj = document.getElementById(activeRowId);

      if (
        rowObj &&
        (this.isFirstActive() || !this.isElementInViewport(rowObj))
      ) {
        rowObj.scrollIntoView({ behavior: "smooth" });
      }
    }

    if (this.isLastActive()) {
      console.log(this.name + " - isLastActive");
      this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }
  };

  isFirstActive() {
    let activeIndex = 0;

    if (this.state.activeJournalItem) {
      activeIndex = this.state.activeJournalItem.index;
    }

    return activeIndex === 0;
  }

  isLastActive() {
    let activeIndex = 0;

    if (this.state.activeJournalItem) {
      activeIndex = this.state.activeJournalItem.index;
    }

    return activeIndex === this.state.journalItems.length - 1;
  }

  isElementInViewport = el => {
    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight ||
          document.documentElement.clientHeight) /*or $(window).height() */ &&
      rect.right <=
        (window.innerWidth ||
          document.documentElement.clientWidth) /*or $(window).width() */
    );
  };

  componentDidUpdate() {
    this.scrollToBottomOrActive();
  }

  onSetActiveRow = (rowId, rowObj, journalItem) => {
    this.journalModel.setActiveJournalItem(journalItem);
  };

  onUpdateFinishStatus = (journalItem, newStatus) => {
    console.log(this.name + " - onUpdateFinishStatus");
    this.props.onFinishEntry(journalItem, newStatus);
  };

  handleKeyPress = e => {
    if (e.keyCode === 37) {
      this.spiritModel.adjustFlame(-1);
    }
    if (e.keyCode === 38) {
      this.changeRowIndex("up");
      e.preventDefault();
    }
    if (e.keyCode === 39) {
      this.spiritModel.adjustFlame(1);
    }
    if (e.keyCode === 40) {
      this.changeRowIndex("down");
      e.preventDefault();
    }
  };

  changeRowIndex = direction => {
    if (this.state.activeJournalItem) {
      let newIndex = this.state.activeJournalItem.index;

      if (direction === "up") {
        newIndex = newIndex - 1;
      } else if (direction === "down") {
        newIndex = Number(newIndex) + 1;
      }

      if (newIndex < 0) {
        newIndex = 0;
      }

      if (newIndex > this.state.journalItems.length - 1) {
        newIndex = this.state.journalItems.length - 1;
      }

      if (this.spiritModel.getActiveScope().isDirty) {
        let oldJournalItem = this.state.activeJournalItem;
        oldJournalItem.flameRating = this.spiritModel.getActiveScope().dirtyFlame;
      }

      let newActiveItem = this.state.journalItems[newIndex];
      let rowObj = document.getElementById(newActiveItem.id);
      this.onSetActiveRow(newActiveItem.id, rowObj, newActiveItem);
    }
  };

  isActive(id) {
    if (this.state.activeJournalItem) {
      return this.state.activeJournalItem.id === id;
    } else {
      return false;
    }
  }

  getEffectiveDirtyFlame(id) {
    let dirtyFlame = null;
    if (this.isActive(id)) {
      dirtyFlame = this.spiritModel.getActiveScope().dirtyFlame;
    }

    return dirtyFlame;
  }

  /// renders the journal items component from array in the console view
  render() {
    return (
      <div
        id="component"
        className="journalItems"
        style={{ height: DimensionController.getHeightFor(this) }}
      >
        <Grid inverted onKeyPress={this.handleKeyPress}>
          {this.state.journalItems.map(d => (
            <JournalItem
              key={d.id}
              id={d.id}
              isMyJournal={!this.journalModel.isAltMemberSelected}
              isActive={this.isActive(d.id)}
              dirtyFlame={this.getEffectiveDirtyFlame(d.id)}
              linked={d.linked}
              projectName={d.projectName}
              taskName={d.taskName}
              taskSummary={d.taskSummary}
              description={d.description}
              flameRating={d.flameRating}
              finishStatus={d.finishStatus}
              journalEntryType={d.journalEntryType}
              circleId={d.circleId}
              position={d.position}
              journalItem={d}
              onSetActiveRow={this.onSetActiveRow}
              onUpdateFinishStatus={this.onUpdateFinishStatus}
            />
          ))}
        </Grid>
        <div
          style={{ float: "left", clear: "both" }}
          ref={el => {
            this.messagesEnd = el;
          }}
        />
      </div>
    );
  }
}