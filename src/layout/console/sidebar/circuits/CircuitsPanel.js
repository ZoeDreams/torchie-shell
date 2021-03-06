import React, { Component } from "react";
import {
  List,
  Menu,
  Segment,
  Transition
} from "semantic-ui-react";
import { SidePanelViewController } from "../../../../controllers/SidePanelViewController";
import { RendererControllerFactory } from "../../../../controllers/RendererControllerFactory";
import { DimensionController } from "../../../../controllers/DimensionController";
import ActiveCircuitListItem from "./ActiveCircuitListItem";
import DoItLaterCircuitListItem from "./DoItLaterCircuitListItem";
import RetroCircuitListItem from "./RetroCircuitListItem";
import { BrowserRequestFactory } from "../../../../controllers/BrowserRequestFactory";
import { CircuitClient } from "../../../../clients/CircuitClient";
import { RendererEventFactory } from "../../../../events/RendererEventFactory";

/**
 * The Circuits Panel is a react component that is used primarily by the
 * console sidebar. This panel is used to display relavant circuits
 * to the user. This panel is dynamically updated with a few renderer events.
 * @type {CircuitsPanel}
 */
export default class CircuitsPanel extends Component {
  /**
   * builds the circuit navigator panel.
   * @param props
   */
  constructor(props) {
    super(props);
    this.name = "[CircuitsPanel]";
    this.state = {
      activeItem:
        SidePanelViewController.SubmenuSelection
          .PARTICIPATING_CIRCUITS,
      participatingCircuitsVisible: false,
      doItLaterCircuitsVisible: false,
      retroCircuitsVisible: false,
      title: ""
    };
    this.myController = RendererControllerFactory.getViewController(
      RendererControllerFactory.Views.CONSOLE_SIDEBAR
    );
    this.animationType =
      SidePanelViewController.AnimationTypes.FLY_DOWN;
    this.animationDelay =
      SidePanelViewController.AnimationDelays.SUBMENU;
    this.selections = {
      activeCircuitComponent: null,
      doItLaterCircuitComponent: null,
      retroCircuitComponent: null
    };
    this.activeCircuits = [];
    this.doItLaterCircuits = [];
    this.retroCircuits = [];
  }

  /**
   * event handler for our circuits sub menu click.
   * @param e
   * @param name
   */
  handleCircuitSubmenuClick = (e, { name }) => {
    this.myController.changeActiveCircuitsSubmenuPanel(
      name
    );
  };

  /**
   * called we are rendering this component into view. This will ask the circuit manager
   * in the main process for new circuit data.
   */
  componentDidMount() {
    this.circuitStartStopListener = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_START_STOP,
      this,
      this.onCircuitStartStop
    );
    this.circuitPauseResumeListener = RendererEventFactory.createEvent(
      RendererEventFactory.Events
        .VIEW_CONSOLE_CIRCUIT_PAUSE_RESUME,
      this,
      this.onCircuitPauseResume
    );
    this.myController.configureCircuitsPanelListener(
      this,
      this.onRefreshCircuitsPanel
    );
    this.onRefreshCircuitsPanel();
  }

  /**
   * called when we remove this circuit from view. this clears the listeners for proper
   * memory management.
   */
  componentWillUnmount() {
    this.circuitStartStopListener.updateCallback(
      this,
      null
    );
    this.circuitPauseResumeListener.updateCallback(
      this,
      null
    );
    this.myController.configureCircuitsPanelListener(
      this,
      null
    );
  }

  /**
   * gui event handler for when we receive view event for when a circuit starts or stops.
   * When a circuit stops, it is removed from the renderer.
   * @param event
   * @param arg
   */
  onCircuitStartStop = (event, arg) => {
    this.onRefreshCircuitsPanel();
  };

  /**
   * event handler that is called when we pause or resume a circuit.
   * @param event
   * @param arg
   */
  onCircuitPauseResume = (event, arg) => {
    this.onRefreshCircuitsPanel();
  };

  /**
   * callback function that was performed when we refresh this component in the view
   */
  onRefreshCircuitsPanel = () => {
    switch (
      this.myController.activeCircuitsSubmenuSelection
    ) {
      case SidePanelViewController.SubmenuSelection
        .PARTICIPATING_CIRCUITS:
        this.showParticipatingCircuitsPanel();
        break;
      case SidePanelViewController.SubmenuSelection
        .DO_IT_LATER_CIRCUITS:
        this.showDoItLaterCircuitsPanel();
        break;
      case SidePanelViewController.SubmenuSelection
        .RETRO_CIRCUITS:
        this.showRetroCircuitsPanel();
        break;
      default:
        throw new Error("Unknown circuits panel menu item");
    }
  };

  /**
   * shows our active circuits that we are joined to
   */
  showParticipatingCircuitsPanel() {
    this.setState({
      activeItem:
        SidePanelViewController.SubmenuSelection
          .PARTICIPATING_CIRCUITS,
      participatingCircuitsVisible: true,
      doItLaterCircuitsVisible: false,
      retroCircuitVisible: false
    });
    CircuitClient.getAllMyParticipatingCircuits(
      this,
      arg => {
        this.activeCircuits = arg.data;
        this.forceUpdate();
      }
    );
  }

  /**
   * shows our list of circuits we are participating in that are currently on hold
   * with a do it later status
   */
  showDoItLaterCircuitsPanel() {
    this.setState({
      activeItem:
        SidePanelViewController.SubmenuSelection
          .DO_IT_LATER_CIRCUITS,
      participatingCircuitsVisible: false,
      doItLaterCircuitsVisible: true,
      retroCircuitVisible: false
    });
    CircuitClient.getAllMyDoItLaterCircuits(this, arg => {
      this.doItLaterCircuits = arg.data;
      this.forceUpdate();
    });
  }

  /**
   * displays the retro circuits panel in the console sidebar gui
   */
  showRetroCircuitsPanel() {
    this.setState({
      activeItem:
        SidePanelViewController.SubmenuSelection
          .RETRO_CIRCUITS,
      participatingCircuitsVisible: false,
      doItLaterCircuitsVisible: false,
      retroCircuitVisible: true
    });

    console.log("show retro");

    CircuitClient.getAllMyRetroCircuits(this, arg => {
      console.log("ARG", arg);
      this.retroCircuits = arg.data;
      this.forceUpdate();
    });
  }

  /**
   * mouse click handler for when a user clicks on an item in the active circuit list
   * @param component
   */
  handleClickActiveCircuit = component => {
    this.selections.activeCircuitComponent = component;
    let circuitName = component.props.model.circuitName;
    this.requestBrowserToLoadActiveCircuit(circuitName);
  };

  /**
   * handles our do it later circuit click
   * @param component
   */
  handleClickDoItLaterCircuit = component => {
    this.selections.doItLaterCircuitComponent = component;
    let circuitName = component.props.model.circuitName;
    this.requestBrowserToLoadDoItLaterCircuit(circuitName);
  };

  handleClickRetroCircuit = component => {
    this.selections.retroCircuitComponent = component;
    let circuitName = component.props.model.circuitName;
    this.requestBrowserToLoadRetroCircuit(circuitName);
  };

  /**
   * creates a new request and dispatch this to the browser request listener
   * @param circuitName
   */
  requestBrowserToLoadActiveCircuit(circuitName) {
    let request = BrowserRequestFactory.createRequest(
      BrowserRequestFactory.Requests.ACTIVE_CIRCUIT,
      circuitName
    );
    this.myController.makeSidebarBrowserRequest(request);
  }

  /**
   * generates a browser request object from a gieven circuit name
   * @param circuitName
   */
  requestBrowserToLoadDoItLaterCircuit(circuitName) {
    let request = BrowserRequestFactory.createRequest(
      BrowserRequestFactory.Requests.DO_IT_LATER_CIRCUIT,
      circuitName
    );
    this.myController.makeSidebarBrowserRequest(request);
  }

  /**
   * generates a browser request object from a gieven circuit name
   * @param circuitName
   */
  requestBrowserToLoadRetroCircuit(circuitName) {
    let request = BrowserRequestFactory.createRequest(
      BrowserRequestFactory.Requests.RETRO_CIRCUIT,
      circuitName
    );
    this.myController.makeSidebarBrowserRequest(request);
  }

  /**
   * get our active circuits content to render in the gui
   * @returns {*}
   */
  /// TODO refactor component ActiveCircuitListItem to ParticipatingCircuitListItem
  getParticipatingCircuitsContent = () => {
    return (
      <div className="participatingCircuitsContent">
        <List
          inverted
          divided
          celled
          animated
          verticalAlign="middle"
          size="large"
        >
          {this.activeCircuits.map(model => (
            <ActiveCircuitListItem
              key={model.id}
              model={model}
              onActiveCircuitListItemClick={
                this.handleClickActiveCircuit
              }
            />
          ))}
        </List>
      </div>
    );
  };

  /**
   * builds our do it later content panel for render() in the gui
   * @returns {*}
   */
  getDoItLaterCircuitsContent = () => {
    return (
      <div className="participatingCircuitsContent">
        <List
          inverted
          divided
          celled
          animated
          verticalAlign="middle"
          size="large"
        >
          {this.doItLaterCircuits.map(model => (
            <DoItLaterCircuitListItem
              key={model.id}
              model={model}
              onDoItLaterCircuitListItemClick={
                this.handleClickDoItLaterCircuit
              }
            />
          ))}
        </List>
      </div>
    );
  };

  /**
   * builds our retro content panel for render() in the gui
   * @returns {*}
   */
  getRetroCircuitsContent = () => {
    return (
      <div className="retroCircuitsContent">
        <List
          inverted
          divided
          celled
          animated
          verticalAlign="middle"
          size="large"
        >
          {this.retroCircuits.map(model => (
            <RetroCircuitListItem
              key={model.id}
              model={model}
              onRetroCircuitListItemClick={
                this.handleClickRetroCircuit
              }
            />
          ))}
        </List>
      </div>
    );
  };

  /**
   * renders our component in the gui
   * @returns {*}
   */
  render() {
    let { activeItem } = this.state;
    return (
      <div
        id="component"
        className="consoleSidebarPanel circuitsPanel"
        style={{
          width: "100%",
          height: DimensionController.getHeightFor(
            DimensionController.Components.CONSOLE_LAYOUT
          ),
          opacity: 1
        }}
      >
        <Segment.Group>
          <Menu size="mini" inverted pointing secondary>
            <Menu.Item
              name={
                SidePanelViewController.SubmenuSelection
                  .PARTICIPATING_CIRCUITS
              }
              active={
                activeItem ===
                SidePanelViewController.SubmenuSelection
                  .PARTICIPATING_CIRCUITS
              }
              onClick={this.handleCircuitSubmenuClick}
            />
            <Menu.Item
              name={
                SidePanelViewController.SubmenuSelection
                  .DO_IT_LATER_CIRCUITS
              }
              active={
                activeItem ===
                SidePanelViewController.SubmenuSelection
                  .DO_IT_LATER_CIRCUITS
              }
              onClick={this.handleCircuitSubmenuClick}
            />
            <Menu.Item
              name={
                SidePanelViewController.SubmenuSelection
                  .RETRO_CIRCUITS
              }
              active={
                activeItem ===
                SidePanelViewController.SubmenuSelection
                  .RETRO_CIRCUITS
              }
              onClick={this.handleCircuitSubmenuClick}
            />
          </Menu>
          <Segment
            inverted
            className={"circuitsContentWrapper"}
            style={{
              height: DimensionController.getCircuitsSidebarPanelHeight()
            }}
          >
            <Transition
              visible={
                this.state.participatingCircuitsVisible
              }
              animation={this.animationType}
              duration={this.animationDelay}
              unmountOnHide
            >
              {this.getParticipatingCircuitsContent()}
            </Transition>
            <Transition
              visible={this.state.doItLaterCircuitsVisible}
              animation={this.animationType}
              duration={this.animationDelay}
              unmountOnHide
            >
              {this.getDoItLaterCircuitsContent()}
            </Transition>
            <Transition
              visible={this.state.retroCircuitsVisible}
              animation={this.animationType}
              duration={this.animationDelay}
              unmountOnHide
            >
              {this.getRetroCircuitsContent()}
            </Transition>
          </Segment>
        </Segment.Group>
      </div>
    );
  }
}
