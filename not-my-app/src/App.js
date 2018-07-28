import React, { Component, createElement } from 'react';
import './App.css';
import createSocket from "sockette-component";

const Sockette = createSocket({
  Component,
  createElement
});

class ProductDetail extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      lastFrameTimestamp: null,
      framesCount: 0,
      fps: 0,
      currentImage: null,
      server_stats: {
        cpu_usage: 0,
        ram_usage: 0,
      },
    };
    this.setResolution = this.setResolution.bind(this);
  }

  onOpen = ev => {
    console.log("> Connected!", ev);
  };

  onMessage = ev => {
    //console.log("> Received:", ev.data);
    let result = JSON.parse(ev.data);
    //console.log('cpu: ' + result.cpu_usage + ', ram: ' +  result.ram_usage)
    let newTimestamp = Date.now();
    let newfps = Math.round(1000 / (newTimestamp - this.state.lastFrameTimestamp));
    this.setState({
      currentImage: result.rgb,
      framesCount: this.state.framesCount + 1,
      fps: newfps,
      lastFrameTimestamp: newTimestamp,
      server_stats: {
        cpu_usage: result.cpu_usage,
        ram_usage: result.ram_usage,
      },
    });
  };

  onReconnect = ev => {
    console.log("> Reconnecting...", ev);

  };

  sendMessage = _ => {
    // WebSocket available in state!
    this.state.socket.send("Hello, world!");
  };

  setResolution(e) {
    let width = parseInt(document.getElementById("res-width").value, 10);
    let height = parseInt(document.getElementById("res-height").value, 10);
    let resolution = { "type": "set_resolution", "width": width, "height": height };
    console.log(JSON.stringify(resolution));
    this.state.socket.send(JSON.stringify(resolution));
  }

  render() {
    return (
      <div>
        <input type="text" id="fps-input" value={"FPS: " + this.state.fps} className="form-control" disabled="true" />
        <input type="text" id="cpu-input" value={"CPU Usage: " + this.state.server_stats.cpu_usage + "%"} disabled="true" />
        <input type="text" id="ram-input" value={"RAM Usage: " + this.state.server_stats.ram_usage + "%"} disabled="true" />
        <div className="set-res-container">
          <input type="text" id="res-width" placeholder="Width" className="set-res form-control" />
          <input type="text" id="res-height" placeholder="Height" className="set-res form-control" />
          <button className="set-res btn btn-primary" type="button" onClick={this.setResolution}>Set Resolution</button>
        </div>
        <br />
        <img src={"data:image/png;base64, " + this.state.currentImage} alt="video" />
        <br />
        <Sockette
          url="ws://localhost:8004"
          getSocket={socket => {
            this.setState({ socket: socket });
          }}
          maxAttempts={25}
          onopen={this.onOpen}
          onmessage={this.onMessage}
          onreconnect={this.onReconnect} />
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <ProductDetail />
      </div>
    );
  }
}

export default App;
