const React = require("react");
const ReactDOM = require("react-dom");
const MPV = require("../index");

class Main extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {pause: true, "time-pos": 0, duration: 0};
    this.togglePause = this.togglePause.bind(this);
    this.seek = this.seek.bind(this);
    this.stop = this.stop.bind(this);
    this.loadFile = this.loadFile.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePropertyChange = this.handlePropertyChange.bind(this);
    this.handleSeekMouseDown = this.handleSeekMouseDown.bind(this);
    this.handleSeekMouseUp = this.handleSeekMouseUp.bind(this);
  }
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, false);
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
  }
  handleKeyDown(e) {
    this.mpv.keypress(e);
  }
  handlePropertyChange({name, value}) {
    if (name === "time-pos" && this.seeking) return;
    this.setState({[name]: value});
  }
  togglePause() {
    this.mpv.property("pause", !this.state.pause);
  }
  handleSeekMouseDown() {
    this.seeking = true;
  }
  seek(e) {
    const timePos = +e.target.value;
    this.setState({"time-pos": timePos});
    this.mpv.property("time-pos", timePos);
  }
  handleSeekMouseUp() {
    this.seeking = false;
  }
  stop() {
  }
  loadFile() {
  }
  render() {
    return (
      <div className="container">
        <div className="player">
          <MPV
            ref={mpv => {this.mpv = mpv;}}
            src="example/tos.mkv"
            onComponentMount={this.handleMPVMount}
            onPropertyChange={this.handlePropertyChange}
          />
          <div className="overlay" onClick={this.togglePause} />
        </div>
        <div className="controls">
          <button className="control" onClick={this.togglePause}>
            {this.state.pause ? "▶" : "▮▮"}
          </button>
          <button className="control" onClick={this.stop}>■</button>
          <input
            type="range"
            className="seek"
            min={0}
            step={0.1}
            max={this.state.duration}
            value={this.state["time-pos"]}
            onChange={this.seek}
            onMouseDown={this.handleSeekMouseDown}
            onMouseUp={this.handleSeekMouseUp}
          />
          <button className="control" onClick={this.loadFile}>⏏</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById("main"));
