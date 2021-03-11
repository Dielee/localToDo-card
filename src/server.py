from gevent import monkey
monkey.patch_all()

import os
from gevent.pywsgi import WSGIServer
from api import app

def server():
    http_server = WSGIServer(('0.0.0.0', int(5556)), app)
    http_server.serve_forever()

server()