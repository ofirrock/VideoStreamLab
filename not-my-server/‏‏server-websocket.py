# -*- coding: utf-8 -*-
"""
Created on Tue Jul 24 2018

@authors: Ofek Baba & Ofir Rock
"""

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
import json
from threading import Thread, Event
import time

SERVER_ADDRESS = ''  # '' = 0.0.0.0 -> all IPv4 addresses on the local machine
SERVER_PORT = 8004  # low-level api socket method to find open port = 0


class WebSocketStoppableThread(Thread):
    """
    Thread class with a stop() method.
    The thread itself has to check regularly for the stopped() condition.
    """

    def __init__(self, webSocketClient):
        super(WebSocketStoppableThread, self).__init__()
        self._stop_event = Event()
        self.webSocketClient = webSocketClient

    def stop(self):
        self._stop_event.set()

    def is_stopped(self):
        return self._stop_event.is_set()

    def run(self):
        print("thread started for: ", self.webSocketClient.address)
        messageData = {}
        messageData['movement'] = 3
        while not self.is_stopped():
            try:
                print(self.webSocketClient.state)
                time.sleep(3)
                self.webSocketClient.sendMessage(json.dumps(messageData))
            except:
                print("a thread died")
                self.webSocketClient.close()

clients = {}
class SimpleEcho(WebSocket):

    def handleMessage(self):
        # echo message back to client
        self.sendMessage(self.data)

    def handleConnected(self):
        print(self.address, 'connected')
        webSocketHandlerThread = WebSocketStoppableThread(webSocketClient=self)
        clients[self.address] = {'websocket': self,
                                      'handler': webSocketHandlerThread}
        webSocketHandlerThread.start()

    def handleClose(self):
        print(self.address, 'closed')
        clients[self.address]['handler'].stop()
#        del clients[self.address]

# def handleClient(client):
#    try:
#        print("thread started for", client.address)
#        messageData = {}
#        messageData['movement'] = 5
#        while True:
#            print(client.state)
#            time.sleep(5)
#            client.sendMessage(json.dumps(messageData))
#    except:
#        print("a thread died")
#        client.close()


server = SimpleWebSocketServer(SERVER_ADDRESS, SERVER_PORT, SimpleEcho)
print('websocket-server initialized at ws://%s:%s'
      % ('0.0.0.0' if (SERVER_ADDRESS == '') else SERVER_ADDRESS,
         '<open-port-internal>' if (SERVER_PORT == 0) else SERVER_PORT))
server.serveforever()
