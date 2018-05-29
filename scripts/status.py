#!/usr/bin/env python3.6

import cgi
import cgitb
import os
from tempfile import gettempdir
from pathlib import Path
import sys

# set up cgi
cgitb.enable()
form = cgi.FieldStorage()
cgitb.enable(display=1)

# get values from post
status = form.getvalue("status")

statusfile = gettempdir() + '/' + status

print("Content-type: text/html\n")

isfile = Path(statusfile)
if not isfile.is_file():
    print("0")
else:
    f = open(isfile, "r")
    print(f.read())
    f.close()
