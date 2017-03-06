const React = require("react");
const ReactDOM = require("react-dom");
const MPV = require("../index");

class Main extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      pause: true,
    };
  }
  render() {
    return (
      <div className="container">
        <MPV
          style={{flex: 1}}
          src="example/tos.mkv"
          pause={this.state.pause}
        />
        <div className="controls">
          <button className="control">{this.state.pause ? "▶" : "▮▮"}</button>
          <button className="control">■</button>
          <input type="range" className="seek" />
          <button className="control">⏏</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById("main"));
