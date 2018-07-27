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
import traceback
import logging
from zlib import compress
import lz4.frame
import lz4framed
import base64

import mss
import mss.tools

import psutil  # for cpu and ram usage


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
        self._change_resultion_event = Event()
        self.webSocketServer = webSocketServer
        self.rect = {'top': 0, 'left': 0, 'width': WIDTH, 'height': HEIGHT}
        self.new_rect = {'top': 0, 'left': 0, 'width': WIDTH, 'height': HEIGHT}
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

    def res_changed(self):
        return self._change_resultion_event.is_set()

    def set_resolution(self, w, h):
        self.new_rect['width'] = w
        self.new_rect['height'] = h
        self._change_resultion_event.set()

    def run(self):
        print("thread started")
        self.started = True
        with mss.mss() as sct:
            while True:
                if not self.is_stopped():
                    if self.res_changed():
                        self.rect = self.new_rect
                        self._change_resultion_event.clear()
                    self.running = True
                    try:
                        # capture image
                        img = mss.mss().grab(self.rect)
                        # png in memory
                        img_png = mss.tools.to_png(img.rgb, img.size)
                        # get stats, convert img data to ascii
                        # and save to dict object
                        # TODO: IMPORTANT - we have a memory leak
                        #  (look at memory percentage over time)
                        # TODO: create a different thread for sending stats
                        #  every 1 second
                        data_to_send = {
                            'cpu_usage': round(
                                psutil.cpu_percent(), 2
                            ),
                            'ram_usage': round(
                                psutil.virtual_memory().percent, 2
                            ),
                            'rgb': base64.b64encode(img_png)
                            .decode('ascii')
                        }
                        # convert message to json and send to all clients
                        self.webSocketServer.send_message_to_all(
                            json.dumps(data_to_send))
                    except Exception as e:
                        print("Exception " + str(e))
                        ex_type, ex, tb = sys.exc_info()
                        traceback.print_tb(tb)
                        time.sleep(1)

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
# server.send_message_to_all("Hey all, a new client has joined us")


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
    try:
        jmessage = json.loads(message)
        if jmessage["type"] == "set_resolution":
            print("setting new resolution")
            thread.set_resolution(jmessage['width'], jmessage['height'])
    except Exception as e:
        print("Exception " + str(e))
        ex_type, ex, tb = sys.exc_info()
        traceback.print_tb(tb)


PORT = 8004
try:
    server = WebsocketServer(PORT, host='', loglevel=logging.INFO)
    server.set_fn_new_client(new_client)
    server.set_fn_client_left(client_left)
    server.set_fn_message_received(message_received)
    thread = WebSocketStoppableThread(server)
    server.run_forever()
except KeyboardInterrupt:
    print('W: interrupt received, stopping…')
except Exception as e:
    print("Exception " + str(e))
finally:
    print('clean up')
    exit()
