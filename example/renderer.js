const React = require("react");
const ReactDOM = require("react-dom");
const MPV = require("../index");

class Main extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {pause: true, timePos: 0};
    this.togglePause = this.togglePause.bind(this);
    this.stop = this.stop.bind(this);
    this.loadFile = this.loadFile.bind(this);
  }
  togglePause() {
    this.setState({pause: !this.state.pause});
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
            src="example/tos.mkv"
            pause={this.state.pause}
            time-pos={this.state.timePos}
          />
          <div className="overlay" onClick={this.togglePause} />
        </div>
        <div className="controls">
          <button className="control" onClick={this.togglePause}>
            {this.state.pause ? "▶" : "▮▮"}
          </button>
          <button className="control" onClick={this.stop}>■</button>
          <input type="range" className="seek" />
          <button className="control" onClick={this.loadFile}>⏏</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById("main"));
