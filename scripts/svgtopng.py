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

def writestatus(temp, status):
    f = open(gettempdir() + "/" + temp, 'w')
    f.write(status)
    f.close()

# Logging file location is based on script location
logpath = os.path.abspath(os.path.realpath(__file__) + "/../../../log/svgtopng/")

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
fullfnsvg = fld + fn + '.svg'
fullfnemf = fld + fn + '.emf'
fullfntmpsvg = gettempdir() + '/' + fn + '.svg'
fullfntmppng = gettempdir() + '/' + fn + '.png'
fullfntsv = fld + fn + '.tsv'
fullfn_tiff = fld + fn + '.tiff'
fullfn_eps = fld + fn + '.eps'
htmlfn = gettempdir() + '/' + fn + '.html'

# write an html file (for correct rendering for png)
f = open(htmlfn, 'w')
f.write("""<!DOCTYPE html>
    <html>
        <head>
            <style>
                body {font-family:Arial;}
            </style>
        </head>
        <body>
        """)
f.write(svgdata)
f.write("""
        </body>
    </html>""")

# write svg file
f = open(fullfnsvg, 'w')
f.write(svgdata)
f.close()
logging.info("Wrote tmp svg file: " + fullfnsvg)

# create a compressed png file from svg using wkhtmltoimage and pngcrush
isfile = Path(fullfnpng1)
if not isfile.is_file():
    # Render SVG to PNG
    run(["/usr/bin/xvfb-run", "--server-args", "-screen 0, 1920x1024x24", "/home/ubuntu/bin/wkhtmltoimage", "--zoom", "3", "-f", "png", "--use-xserver", htmlfn , fullfntmppng], stderr=DEVNULL, stdout=DEVNULL)
    writestatus(fn, "1")
    # Soften PNG 
    run(["/usr/bin/convert", fullfntmppng, "-blur", "1x0.2", fullfntmppng], stderr=DEVNULL, stdout=DEVNULL)
    writestatus(fn, "2")
    # Create TIFF from PNG
    run(["/usr/bin/convert", fullfntmppng, fullfn_tiff], stderr=DEVNULL, stdout=DEVNULL)
    writestatus(fn, "3")
    # Create EPS from SVG
    run(["/usr/bin/inkscape", "-E", fullfn_eps,  fullfnsvg, "--export-area-page","--export-text-to-path", "--export-ignore-filters"], stderr=DEVNULL, stdout=DEVNULL)
    writestatus(fn, "4")
    logging.info("/usr/bin/inkscape" + "-E" +fullfn_eps+ fullfnsvg +"--export-area-page --export-text-to-path --export-ignore-filters")
    # Compress PNG (lossless)
    run(["/usr/bin/pngcrush", "-res", "300", fullfntmppng, fullfnpng1], stdout=DEVNULL, stderr=DEVNULL)
    writestatus(fn, "5")
    # Create EMF from SVG
    run(["/usr/bin/inkscape", "--file", fullfnsvg, "--export-emf", fullfnemf], stdout=DEVNULL, stderr=DEVNULL)

writestatus(fn, "6")

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
print("/genegraphics/temp/" + fn + ".svg")
print("/genegraphics/temp/" + fn + ".emf")
print("/genegraphics/temp/" + fn + ".tsv")
print("/genegraphics/temp/" + fn + ".tiff")
print("/genegraphics/temp/" + fn + ".eps")
print(wh_str)

logging.info("Response data sent.")
