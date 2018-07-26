import React, { Component, createElement } from 'react';
import logo from './logo.svg';
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
      };
      this.setResultion = this.setResultion.bind(this);
    }

    onOpen = ev => {
      console.log("> Connected!", ev);
    };
   
    onMessage = ev => {
      //console.log("> Received:", ev.data);
      //let result = JSON.parse(ev.data);
      let newTimestamp = Date.now();
      let newfps = Math.round (1000 / (newTimestamp - this.state.lastFrameTimestamp));
      this.setState({
        currentImage: ev.data,
        framesCount: this.state.framesCount+1,
        fps: newfps,
        lastFrameTimestamp: newTimestamp,
      });
      this.setState({currentImage: ev.data});
    };
   
    onReconnect = ev => {
      console.log("> Reconnecting...", ev);
      
    };
   
    sendMessage = _ => {
      // WebSocket available in state!
      this.state.socket.send("Hello, world!");
    };
    
    setResultion(e){
      let width = parseInt(document.getElementById("res-width").value);
      let height = parseInt(document.getElementById("res-height").value);
      let resultion = {"type": "set_resolution", "width": width, "height": height};
      console.log(JSON.stringify(resultion));
      this.state.socket.send(JSON.stringify(resultion));
    }

    render() {
      return (
        <div>
          <input type="text" id="fps-input" value={"FPS:" + this.state.fps} className="form-control" disabled="true" />
          <div className="set-res-container">
            <input type="text" id="res-width" placeholder="Width" className="set-res form-control" />
            <input type="text" id="res-height" placeholder="Height" className="set-res form-control" />
            <button className="set-res btn btn-primary" type="button" onClick={this.setResultion}>Set Resolution</button>
          </div>
          <br />
          <img src={"data:image/png;base64, " + this.state.currentImage} alt="video" />
          <br />
          <Sockette
          url="ws://localhost:8004"
          getSocket={socket => {
            this.setState({socket});
          }}
          maxAttempts={25}
          onopen={this.onOpen}
          onmessage={this.onMessage}
          onreconnect={this.onReconnect}/>
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
