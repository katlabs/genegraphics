#!/usr/bin/env python3.6

import cgi
import cgitb
import os
from hashlib import md5
import subprocess
from PIL import Image
from subprocess import run, DEVNULL
from tempfile import gettempdir
from pathlib import Path
from xml.etree import ElementTree as ET
import sys
import logging

# Logging file location is based on script location
logpath = os.path.abspath(os.path.realpath(__file__) + "/../../../../log/svgtopng/")

# set up logging
logging.basicConfig(filename=logpath + '/main.log',format='%(asctime)s %(message)s',level=logging.DEBUG)

# set up cgi
cgitb.enable()
form = cgi.FieldStorage()
cgitb.enable(display=0, logdir=logpath)

# get values from post
svgdata = form.getvalue("svgdata")
tsvdata = form.getvalue("tsvdata")
svg_w = form.getvalue("width")
logging.info("Got form data.")
logging.info("Width = " + svg_w)

# alert on malformed xml
try:
    ET.fromstring(svgdata.encode('utf-8'))
except:
    print("Content-type: text/html\n")
    logging.error("ERROR: Malformed XML data received.")
    sys.exit("ERROR: Malformed XML data received.")
logging.info("Received valid svg data.")

# create the filename from hash function
fld = os.path.abspath(os.path.realpath(__file__) + "/../../temp/") + "/"
if not os.path.isdir(fld):
    os.mkdir(fld)

fn = md5(svgdata.encode('utf-8')).hexdigest()
fullfnpng1 = fld + fn + '.png'
fullfnpng2 = fld + fn + '_origres.png'
fullfnsvg = fld + fn + '.svg'
fullfnemf = fld + fn + '.emf'
fullfntmpsvg = gettempdir() + '/' + fn + '.svg'
fullfntmppng = gettempdir() + '/' + fn + '.png'
fullfntsv = fld + fn + '.tsv'


# write svg file
f = open(fullfntmpsvg, 'w')
f.write(svgdata)
f.close()
logging.info("Wrote tmp svg file: " + fullfntmpsvg)

# create a compressed png file from svg using wkhtmltoimage and pngcrush
isfile = Path(fullfnpng1)
if not isfile.is_file():
    run(["/usr/bin/rsvg-convert", fullfntmpsvg, "-w", "1920", "-f", "svg", "-o", fullfnsvg], stderr=DEVNULL, stdout=DEVNULL)
    run(["/usr/bin/xvfb-run", "--server-args", "-screen 0, 1920x1024x24", "/home/ubuntu/bin/wkhtmltoimage", "-f", "png", "--use-xserver", fullfnsvg , fullfntmppng], stderr=DEVNULL, stdout=DEVNULL)
    run(["/usr/bin/pngcrush", "-res", "300", fullfntmppng, fullfnpng1], stdout=DEVNULL, stderr=DEVNULL)
    run(["/usr/bin/inkscape", "--file", fullfnsvg, "--export-emf", fullfnemf], stdout=DEVNULL, stderr=DEVNULL)
    run(["/usr/bin/convert", fullfnpng1, "-resize", svg_w, fullfnpng2], stdout=DEVNULL, stderr=DEVNULL)

# create a tsv file
f = open(fullfntsv, 'w')
f.write(tsvdata)
f.close()
logging.info("Wrote tsv file: " + fullfntsv)

# get high-res image height and width
wh_str = "xxx"
with Image.open(fullfnpng1) as img:
    png_w, png_h = img.size

wh_str = str(png_w) + 'x' + str(png_h)
logging.info("wxh string = " + wh_str)

# output the filenames as the response data
print("Content-type: text/html\n")
print("/genegraphics/temp/" + fn + ".png")
print("/genegraphics/temp/" + fn + "_origres.png")
print("/genegraphics/temp/" + fn + ".svg")
print("/genegraphics/temp/" + fn + ".emf")
print("/genegraphics/temp/" + fn + ".tsv")
print(wh_str)

logging.info("Response data sent.")
