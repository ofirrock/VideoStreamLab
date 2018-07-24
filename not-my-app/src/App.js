import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Websocket from 'react-websocket';
 
  class ProductDetail extends React.Component {
 
    constructor(props) {
      super(props);
      this.state = {
        count: 90
      };
    }
 
    handleData(data) {
      let result = JSON.parse(data);
      this.setState({count: this.state.count + result.movement});
    }
 
    render() {
      return (
        <div>
          Count: <strong>{this.state.count}</strong>
 
          <Websocket url='ws://localhost:8003'
              onMessage={this.handleData.bind(this)}/>
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
