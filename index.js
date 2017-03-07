/**
 * Corresponding JS part of mpv pepper plugin.
 * @module mpv.js
 */

"use strict";

const React = require("react");

/**
 * React wrapper.
 */
class MPV extends React.Component {
  /**
   * Send a command to the player.
   *
   * @param {string} cmd - Command name
   * @param {...*} args - Arguments
   */
  command(cmd, ...args) {
    args = args.map(arg => arg.toString());
    this._postData("command", [cmd].concat(args));
  }

  /**
   * Set a property to a given value.
   *
   * @param {string} name - Property name
   * @param {*} value - Property value
   */
  property(name, value) {
    const data = {name, value};
    this._postData("set_property", data);
  }

  /**
   * Get a notification whenever the given property changes.
   *
   * @param {string} name - Property name
   */
  observe(name) {
    this._postData("observe_property", name);
  }

  /**
   * Send a key event through mpv's input handler, triggering whatever
   * behavior is configured to that key.
   *
   * @param {KeyboardEvent} event
   */
  keypress({key, shiftKey, ctrlKey, altKey}) {
    // Don't need modifier events.
    if ([
      "Escape", "Shift", "Control", "Alt",
      "Compose", "CapsLock", "Meta",
    ].includes(key)) return;

    if (key.startsWith("Arrow")) {
      key = key.slice(5).toUpperCase();
      if (shiftKey) {
        key = `Shift+${key}`;
      }
    }
    if (ctrlKey) {
      key = `Ctrl+${key}`;
    }
    if (altKey) {
      key = `Alt+${key}`;
    }

    // Ignore exit keys for default keybindings settings.
    if ([
      "q", "Q", "ESC", "POWER", "STOP",
      "CLOSE_WIN", "CLOSE_WIN", "Ctrl+c",
      "AR_PLAY_HOLD", "AR_CENTER_HOLD",
    ].includes(key)) return;

    this.command("keypress", key);
  }

  /**
   * Enter fullscreen.
   */
  fullscreen() {
    this.node().webkitRequestFullscreen();
  }

  /**
   * Synchronously destroy mpv instance. You might want to call this on
   * quit in order to cleanup files currently being opened in mpv.
   */
  destroy() {
    this.node().remove();
  }

  /**
   * Return a plugin DOM node.
   *
   * @return {HTMLEmbedElement}
   */
  node() {
    return this.refs.plugin;
  }

  _postData(type, data) {
    const msg = {type, data};
    this.node().postMessage(msg);
  }
  constructor(props) {
    super(props);
    this.handleMessage = this.handleMessage.bind(this);
  }
  componentDidMount() {
    this.node().addEventListener("message", this.handleMessage, false);
  }
  componentWillUnmount() {
    this.node().removeEventListener("message", this.handleMessage, false);
  }
  handleMessage(e) {
    const msg = e.data;
    const {type, data} = msg;
    if (type === "property_change" && this.props.onPropertyChange) {
      const {name, value} = data;
      this.props.onPropertyChange(name, value);
    } else if (type === "ready" && this.props.onReady) {
      this.props.onReady(this);
    }
  }
  render() {
    const defaultStyle = {display: "block", width: "100%", height: "100%"};
    return React.createElement("embed", {
      ref: "plugin",
      type: "application/x-mpvjs",
      className: this.props.className,
      style: Object.assign(defaultStyle, this.props.style),
    });
  }
}

/**
 * Accepted properties.
 */
MPV.propTypes = {
  /**
   * The CSS class name of the plugin element.
   */
  className: React.PropTypes.string,
  /**
   * Override the inline-styles of the plugin element.
   */
  style: React.PropTypes.object,
  /**
   * Callback function that is fired when mpv is ready to accept
   * commands.
   *
   * @param {Object} mpv - Component instance
   */
  onReady: React.PropTypes.func,
  /**
   * Callback function that is fired when one of the observed properties
   * changes.
   *
   * @param {string} name - Property name
   * @param {*} value - Property value
   */
  onPropertyChange: React.PropTypes.func,
};

module.exports = {
  react: {MPV},
};
