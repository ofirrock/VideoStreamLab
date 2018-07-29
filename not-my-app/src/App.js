import React, { Component, createElement } from 'react';
import './App.css';
import createSocket from "sockette-component";
import { AreaChart, Area, YAxis, XAxis, Tooltip, CartesianGrid} from 'recharts';

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
      chartData:
        [
        ],
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
    switch(result.type){
      case 'image':
        this.setState({
          currentImage: result.rgb,
          framesCount: this.state.framesCount + 1,
          fps: newfps,
          lastFrameTimestamp: newTimestamp,
        });
        break;
      
      case 'stats':
        let d = new Date();
        let newChartData = this.state.chartData;
        newChartData.push(
          {
            timestamp: d.getMinutes() + ":" + d.getSeconds(),
            cpu: result.cpu_usage,
            ram: result.ram_usage,
            fps: this.state.fps,
          }
        );
        newChartData.slice(-15); 
        this.setState({
          server_stats: {
            cpu_usage: result.cpu_usage,
            ram_usage: result.ram_usage,
          },
          chartData: newChartData,
        });
        break;
      
      default:
        console.log("Unknown message received");
    }
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
        <div className="panel-header panel-header-lg">
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
        <div className="content">
          <div className="row">
            <div className="col-lg-4">
              <div className="card card-chart">
                <div className="card-header">
                  <h5 className="card-category">Server Load</h5>
                  <h4 className="card-title">RAM Usage</h4>
                </div>
                <div className="card-body">
                  <div className="chart-area">
                    <AreaChart 
                      width={600}
                      height={190}
                      data={this.state.chartData.slice()}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" />
                      <YAxis type="number" domain={[0, 100]}/>
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area type="monotone" dataKey="ram" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="stats">
                      <i className="now-ui-icons arrows-1_refresh-69"></i> Just Updated
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card card-chart">
                <div className="card-header">
                  <h5 className="card-category">Server Load</h5>
                  <h4 className="card-title">CPU Usage</h4>
                </div>
                <div className="card-body">
                  <div className="chart-area">
                    <AreaChart 
                      width={600}
                      height={190}
                      data={this.state.chartData.slice()}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" />
                      <YAxis type="number" domain={[0, 100]}/>
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area type="monotone" dataKey="cpu" stroke="#8884d8" fillOpacity={1} fill="url(#colorPv)" />
                    </AreaChart>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="stats">
                      <i className="now-ui-icons arrows-1_refresh-69"></i> Just Updated
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card card-chart">
                <div className="card-header">
                  <h5 className="card-category">Performance</h5>
                  <h4 className="card-title">FPS</h4>
                </div>
                <div className="card-body">
                  <div className="chart-area">
                    <AreaChart 
                      width={600}
                      height={190}
                      data={this.state.chartData.slice()}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorDv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#cc3232" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#cc3232" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area type="monotone" dataKey="fps" stroke="#8884d8" fillOpacity={1} fill="url(#colorDv)" />
                    </AreaChart>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="stats">
                      <i className="now-ui-icons arrows-1_refresh-69"></i> Just Updated
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
