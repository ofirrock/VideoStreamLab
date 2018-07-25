# -*- coding: utf-8 -*-
"""
Created on Tue Jul 24 2018

@authors: Ofek Baba & Ofir Rock
"""

from websocket_server import WebsocketServer
import json
from threading import Thread, Event
import time
import sys
import logging
from zlib import compress
import lz4.frame
import lz4framed
import base64

import mss
import mss.tools


WIDTH = 640
HEIGHT = 480
            
class WebSocketStoppableThread(Thread):
    """
    Thread class with a stop() method.
    The thread itself has to check regularly for the stopped() condition.
    """

    def __init__(self, webSocketServer):
        super(WebSocketStoppableThread, self).__init__()
        self._stop_event = Event()
        self.webSocketServer = webSocketServer
        self.running = False
        self.started = False

    def stop(self):
        self._stop_event.set()
    
    def restart(self):
        self._stop_event.clear()
        
    def is_stopped(self):
        return self._stop_event.is_set()
    
    def is_running(self):
        return self.running
    
    def run(self):
        print("thread started")
        self.started = True
        rect = {'top': 0, 'left': 0, 'width': WIDTH, 'height': HEIGHT}
        with mss.mss() as sct:
            while True:
                if not self.is_stopped():
                    self.running = True
                    try:
#                        print("sending message to " + str(len(self.webSocketServer.clients)) + " clients")
                        # Capture the screen
                        img = sct.grab(rect)
                        raw_bytes = mss.tools.to_png(img.rgb, img.size)
                        messageData = lz4framed.compress(base64.encodebytes(raw_bytes))
    #                    pixels = lz4framed.compress(img.rgb)  # compress(img.rgb, 6)
    #                    
    #                    # Send the size of the pixels length
    #                    size = len(pixels)
    #                    size_len = (size.bit_length() + 7) // 8
    #                    messageData['size_len'] = bytes([size_len])
    #        
    #                    # Send the actual pixels length
    #                    size_bytes = size.to_bytes(size_len, 'big')
    #                    messageData['size_bytes'] = size_bytes
    #        
    #                    # Send pixels
    #                    messageData['pixels'] = pixels
                        
                        self.webSocketServer.send_message_to_all(messageData)
#                        time.sleep(1/60)
                    except TypeError as e:
                        print ("Type error({0}): {1}".format(e.errno, e.strerror))
                        print ("the thread died")
                else:
                    self.running = False
        

# Called for every client connecting (after handshake)
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])
    if not thread.is_running():
        if not thread.started:
            thread.start()
        else:
            thread.restart()
#	server.send_message_to_all("Hey all, a new client has joined us")


# Called for every client disconnecting
def client_left(client, server):
    print("Client(%d) disconnected" % client['id'])
    if len(server.clients) == 1:
        thread.stop()


# Called when a client sends a message
def message_received(client, server, message):
	if len(message) > 200:
		message = message[:200]+'..'
	print("Client(%d) said: %s" % (client['id'], message))


PORT=8004
server = WebsocketServer(PORT, host='', loglevel=logging.INFO)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
thread = WebSocketStoppableThread(server)
server.run_forever()
