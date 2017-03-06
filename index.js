const React = require("react");

module.exports = class extends React.Component {
  constructor(props) {
    super(props);
    this.handleMessage = this.handleMessage.bind(this);
  }
  componentDidMount() {
    this.refs.plugin.addEventListener("message", this.handleMessage, false);
  }
  componentWillUnmount() {
    this.refs.plugin.removeEventListener("message", this.handleMessage, false);
  }
  componentWillReceiveProps(nextProps) {
    Object.keys(nextProps).forEach(name => {
      const oldValue = this.props[name];
      const value = nextProps[name];
      if (value !== oldValue) {
        this.postData("set_property", {name, value});
      }
    });
  }
  handleMessage(e) {
    const msg = e.data;
    const {type, data} = msg;
    switch (type) {
    case "pause":
      this.props.onPlayPause(data);
      break;
    case "time-pos":
      this.props.onTime(Math.max(0, data));
      break;
    case "volume":
      this.props.onVolume({volume: Math.floor(data)});
      break;
    case "mute":
      this.props.onVolume({mute: data});
      break;
    case "eof-reached":
      if (data) {
        this.props.onEOF();
      }
      break;
    case "deinterlace":
      this.props.onDeinterlace(data);
      break;
    case "sid":
      // mpv actually doesn't send sid=0 ever, check just in case.
      if (data > 0) {
        this.props.onSubTrack(data - 1);
      }
      break;
    }
  }
  sendKey({key, shiftKey, ctrlKey, altKey}) {
    // Don't need modifier events.
    if ([
      "Shift", "Control", "Alt",
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

    // Ignore exit keys for default keybindings settings. Kludgy but mpv
    // don't propose anything better.
    if ([
      "q", "Q", "ESC", "POWER", "STOP",
      "CLOSE_WIN", "CLOSE_WIN", "Ctrl+c",
      "AR_PLAY_HOLD", "AR_CENTER_HOLD",
    ].includes(key)) return;

    this.postData("keypress", key);
  }
  postData(type, data) {
    const msg = {type, data};
    try {
      this.refs.plugin.postMessage(msg);
    } catch (e) {
      // Don't break functionality when plugin failed to init.
    }
  }
  render() {
    const defaultStyle = {display: "block", width: "100%", height: "100%"};
    const props = Object.assign({}, this.props, {
      ref: "plugin",
      type: "application/x-mpvjs",
      style: Object.assign(defaultStyle, this.props.style),
      "data-src": this.props.src,
    });
    return React.createElement("embed", props);
  }
}
