const React = require("react");

class MPV extends React.Component {
  // PUBLIC API.

  command(cmd, ...args) {
    args = args.map(arg => arg.toString());
    this.postData("command", [cmd].concat(args));
  }

  property(name, value) {
    this.postData("set_property", {name, value});
  }

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

  fullscreen() {
    this.node().webkitRequestFullscreen();
  }

  destroy() {
    this.node().remove();
  }

  node() {
    return this.refs.plugin;
  }

  // PRIVATE METHODS, DO NOT USE!

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
      this.props.onPropertyChange(data);
    } else if (type === "ready" && this.props.onReady) {
      this.props.onReady(this);
    }
  }
  postData(type, data) {
    const msg = {type, data};
    this.node().postMessage(msg);
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

MPV.propTypes = {
  className: React.PropTypes.string,
  style: React.PropTypes.object,
  onReady: React.PropTypes.func,
  onPropertyChange: React.PropTypes.func,
};

module.exports = {
  react: {MPV},
};
