const path = require("path");
const React = require("react");
const ReactDOM = require("react-dom");
const {remote} = require("electron");
const {MPV} = require("../index").react;

class Main extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mpv = null;
    this.state = {pause: true, "time-pos": 0, duration: 0};
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMPVReady = this.handleMPVReady.bind(this);
    this.handlePropertyChange = this.handlePropertyChange.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.handleSeek = this.handleSeek.bind(this);
    this.handleSeekMouseDown = this.handleSeekMouseDown.bind(this);
    this.handleSeekMouseUp = this.handleSeekMouseUp.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, false);
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
  }
  handleKeyDown(e) {
    if (!this.state.duration) return;
    this.mpv.keypress(e);
  }
  handleMPVReady(mpv) {
    this.mpv = mpv;
    this.mpv.command("loadfile", path.join(__dirname, "tos.mkv"));
  }
  handlePropertyChange({name, value}) {
    if (name === "time-pos" && this.seeking) return;
    this.setState({[name]: value});
  }
  togglePause(e) {
    e.target.blur();
    if (!this.state.duration) return;
    this.mpv.property("pause", !this.state.pause);
  }
  handleStop(e) {
    e.target.blur();
    this.mpv.property("pause", true);
    this.mpv.command("stop");
    this.setState({"time-pos": 0, duration: 0});
  }
  handleSeekMouseDown() {
    this.seeking = true;
  }
  handleSeek(e) {
    e.target.blur();
    const timePos = +e.target.value;
    this.setState({"time-pos": timePos});
    this.mpv.property("time-pos", timePos);
  }
  handleSeekMouseUp() {
    this.seeking = false;
  }
  handleLoad(e) {
    e.target.blur();
    const items = remote.dialog.showOpenDialog({filters: [
      {name: "Videos", extensions: ["mkv", "mp4", "mov", "avi"]},
      {name: "All files", extensions: ["*"]},
    ]});
    if (items) {
      this.mpv.command("loadfile", items[0]);
    }
  }
  render() {
    return (
      <div className="container">
        <div className="player">
          <MPV
            onReady={this.handleMPVReady}
            onPropertyChange={this.handlePropertyChange}
          />
          <div className="overlay" onClick={this.togglePause} />
        </div>
        <div className="controls">
          <button className="control" onClick={this.togglePause}>
            {this.state.pause ? "▶" : "▮▮"}
          </button>
          <button className="control" onClick={this.handleStop}>■</button>
          <input
            className="seek"
            type="range"
            min={0}
            step={0.1}
            max={this.state.duration}
            value={this.state["time-pos"]}
            onChange={this.handleSeek}
            onMouseDown={this.handleSeekMouseDown}
            onMouseUp={this.handleSeekMouseUp}
          />
          <button className="control" onClick={this.handleLoad}>⏏</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById("main"));
