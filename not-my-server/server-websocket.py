# -*- coding: utf-8 -*-
"""
Created on Tue Jul 24 13:15:47 2018

@author: ofek
"""

from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
import json
from threading import Thread, Event
import time


class StoppableThread(Thread):
    """Thread class with a stop() method. The thread itself has to check
    regularly for the stopped() condition."""

    def __init__(self, client):
        super(StoppableThread, self).__init__()
        self._stop_event = Event()
        self.client = client

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    def run(self):
        print("thread started for", self.client.address)
        messageData = {}
        messageData['movement'] = 3
        while not self.stopped():
            try:
                print(self.client.state)
                time.sleep(3)
                self.client.sendMessage(json.dumps(messageData))
            except:
                print("a thread died")
                self.client.close()


clients = {}


class SimpleEcho(WebSocket):

    def handleMessage(self):
        # echo message back to client
        self.sendMessage(self.data)

    def handleConnected(self):
        print(self.address, 'connected')
        thread = StoppableThread(self)
        clients[self.address] = {'socket': self, 'handler': thread}
        thread.start()

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


server = SimpleWebSocketServer('', 8003, SimpleEcho)
server.serveforever()
