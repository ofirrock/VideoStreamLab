import React, { Component, createElement } from 'react';
import './App.css';
import createSocket from "sockette-component";
import { ResponsiveContainer, AreaChart, Area, YAxis, XAxis, Tooltip, CartesianGrid} from 'recharts';

const Sockette = createSocket({
  Component,
  createElement
});

class Pinger extends React.Component{
  render(){
    return(
      <div id="pinger">
        <input value={this.props.status} type="text" className="form-control" disabled />
        <button className="btn btn-primary" type="button" onClick={this.props.handler}>Ping Server</button>
      </div>
    );
  }
}

class StatChart extends React.Component {
  shouldComponentUpdate(nextProps, nextState){
    if(nextProps.chartData.length === 0){
      return false;
    }
    if(this.props.chartData.length === 0){
      return true;
    }
    if (this.props.chartData[this.props.chartData.length - 1]["timestamp"]
       === nextProps.chartData[nextProps.chartData.length - 1]["timestamp"]){
      return false;
    }
    return true;
  }

  render(){
    return(
      <div className="card card-chart">
        <div className="card-header">
          <h5 className="card-category">{this.props.cat}</h5>
          <h4 className="card-title">{this.props.title}</h4>
        </div>
        <div className="card-body">
          <div className="chart-area">
          <ResponsiveContainer width="100%">
            <AreaChart 
              height={190}
              data={this.props.chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id={this.props.datakey + "color"} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={this.props.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={this.props.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" />
              <YAxis type="number" domain={[0, 100]} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey={this.props.datakey} stroke="#8884d8" fillOpacity={1} fill={"url(#"+ this.props.datakey +"color)"} />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
        <div className="card-footer">
          <div className="stats">
              <i className="now-ui-icons arrows-1_refresh-69"></i> Just Updated
          </div>
        </div>
      </div>
    );
  }
}

class ProductDetail extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      lastFrameTimestamp: null,
      framesCount: 0,
      fps: 0,
      currentImage: null,
      pingerStatus: "Pending.",
      videoLatency: null,
      server_stats: {
        cpu_usage: 0,
        ram_usage: 0,
      },
      chartData:
        [
        ],
    };
    this.setResolution = this.setResolution.bind(this);
    this.sendPing = this.sendPing.bind(this);
  }

  onOpen = ev => {
    console.log("> Connected!", ev);
  };

  onMessage = ev => {
    //console.log("> Received:", ev.data);
    const result = JSON.parse(ev.data);
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
          videoLatency: Date.now() - result["start_time"],
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

      case 'ping':
        let duration = Date.now() - result["start_time"];
        this.setState({
          pingerStatus: "Response received. (" + duration + "ms); Video latency: (" + this.state.videoLatency + "ms)"
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

  sendPing(e) {
    let pingMessage = {"type": "ping", "start_time": Date.now()};
    console.log(this.state.socket);
    switch(this.state.socket.readyState){
      case 0:
        this.setState({
          pingerStatus: "The connection is not yet open."
        });
        break;
      
      case 1:
        this.state.socket.send(JSON.stringify(pingMessage));
        this.setState({
          pingerStatus: "Ping sent."
        });
        break;

      case 2:
        this.setState({
          pingerStatus: "The connection is in the process of closing."
        });
        break;

      case 3:
        this.setState({
          pingerStatus: "The connection is closed or couldn't be opened."
        });
        break;

      default:
        this.setState({
          pingerStatus: "Something went wrong."
        });
    }
  }

  render() {
    const newData = this.state.chartData.slice(-15);

    return (
      <div>
        <div className="panel-header panel-header-lg">
          <input type="text" id="fps-input" value={"FPS: " + this.state.fps} className="form-control" disabled="true" />
          <div id="server-load-summary">
            <div className="pb-round-large">
              <div class="pb-container pb-cpu" style={{width: this.state.server_stats.cpu_usage+"%"}}>
                <span>{"CPU Usage: " + this.state.server_stats.cpu_usage + "%"}</span>
              </div>
            </div>
            <div className="pb-round-large">
              <div class="pb-container pb-ram" style={{width: this.state.server_stats.ram_usage+"%"}}>
                <span>{"RAM Usage: " + this.state.server_stats.ram_usage + "%"}</span>
              </div>
            </div>

          </div>
          <div className="set-res-container">
            <input type="text" id="res-width" placeholder="Width" className="set-res form-control" />
            <input type="text" id="res-height" placeholder="Height" className="set-res form-control" />
            <button className="set-res btn btn-primary" type="button" onClick={this.setResolution}>Set Resolution</button>
          </div>
          <Pinger status={this.state.pingerStatus} handler={this.sendPing} />
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
              <StatChart cat="Server Load" title="RAM Usage" chartData={newData} color="#8884d8" datakey="ram" />
            </div>
            <div className="col-lg-4">
              <StatChart cat="Server Load" title="CPU Usage" chartData={newData} color="#82ca9d" datakey="cpu" />
            </div>
            <div className="col-lg-4">
              <StatChart cat="Performance" title="FPS" chartData={newData} color="#cc3232" datakey="fps" />
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
