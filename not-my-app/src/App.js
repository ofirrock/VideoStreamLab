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
        count: 90,
        currentImage: null,
      };
    }

    onOpen = ev => {
      console.log("> Connected!", ev);
    };
   
    onMessage = ev => {
      //console.log("> Received:", ev.data);
      //let result = JSON.parse(ev.data);
      this.setState({currentImage: ev.data});
    };
   
    onReconnect = ev => {
      console.log("> Reconnecting...", ev);
      
    };
   
    sendMessage = _ => {
      // WebSocket available in state!
      this.state.socket.send("Hello, world!");
    };
 
    render() {
      return (
        <div>
          Count: <strong>{this.state.count}</strong>
          <img src={"data:image/png;base64, " + this.state.currentImage} alt="video" />
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
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <ProductDetail />
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
