from __future__ import absolute_import, unicode_literals
from celery import Celery
from .secrets import REDIS_PW, REDIS_PORT

app = Celery('imageproc',
             broker='redis://:'+REDIS_PW+'@localhost:'+REDIS_PORT+'/0',
             backend='redis://:'+REDIS_PW+'@localhost:'+REDIS_PORT+'/0',
             include=['imageproc.tasks'])

if __name__ == '__main__':
        app.start()
