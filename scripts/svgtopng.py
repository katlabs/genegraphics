#!/usr/bin/env python3.6

import cgi
import cgitb
import os
from hashlib import md5
import subprocess
from PIL import Image
import shlex
#from subprocess import run, DEVNULL
from subprocess import check_output, DEVNULL, STDOUT, Popen, PIPE
from tempfile import gettempdir
from pathlib import Path
from xml.etree import ElementTree as ET
import sys
import logging
import time

def writestatus(temp, status):
    f = open(gettempdir() + "/" + temp, 'w')
    f.write(status)
    f.close()

def send_error(msg, errs):
    logging.error("[error] " + msg)
    logging.error("[error] {0}".format(errs))
    writestatus(fn, "Error: " + msg)
    print("Content-type: text/html\n")
    print("Error")
    sys.exit()

def exec_command(cmd, statusnum, statusfn):
    try:
        t1 = time.time()
        #proc = Popen(cmd, stderr=PIPE, stdout=PIPE, shell=True)
        #proc = Popen(shlex.split(cmd), stderr=PIPE, stdout=PIPE, shell=True)
        #logging.info('[cmd] '  + proc.args)
        #outs, errs = proc.communicate(timeout=40)
        #cmd = 'exec ' + cmd
        logging.info('[cmd] ' + cmd)
        output = check_output(shlex.split(cmd), stderr=STDOUT, timeout=20)
        logging.info('[cmd] command finished')
            
        if output:
            logging.error("[output] " + str(output))

        writestatus(statusfn, statusnum)
        logging.info("[time] " + str(time.time() - t1))
    except subprocess.CalledProcessError as exc:
        send_error("Process Error", str(exc.output))
    except subprocess.TimeoutExpired as exc:
        send_error("Timeout", str(exc.output))
    except subprocess.SubprocessError as exc:
        send_error("Generic", str(exc.output))

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
logging.info("--------------")
logging.info("Got form data.")
logging.info("Width = " + svg_w)

# alert on malformed xml
try:
    ET.fromstring(svgdata.encode('utf-8'))
except:
    print("Content-type: text/html\n")
    logging.error("[error] Malformed XML data received.")
    sys.exit("ERROR: Malformed XML data received.")
logging.info("Received valid svg data.")

# create the filename from hash function
try:
    fld = os.path.abspath(os.path.realpath(__file__) + "/../../temp/") + "/"
    if not os.path.isdir(fld):
        os.mkdir(fld)
except Exception as e:
    logging.error("[error] {0}".format(e))
    sys.exit()

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

try:
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
except Exception as e:
    logging.error("[error] {0}".format(e))
    sys.exit()

# create a compressed png file from svg using wkhtmltoimage and pngcrush
isfile = Path(fullfnpng1)
if not isfile.is_file():
    # Render SVG to PNG
    cmd = 'xvfb-run -e /dev/stderr --server-args="-screen 0, 1920x1024x24" /home/ubuntu/bin/wkhtmltoimage --zoom 3 -f png --use-xserver {} {}'.format(htmlfn,fullfntmppng)
    exec_command(cmd, "1", fn)

    # Soften PNG
    cmd = " ".join(["/usr/bin/convert", fullfntmppng, "-blur", "1x0.2", fullfntmppng])
    exec_command(cmd, "2", fn)

    # Create TIFF from PNG
    cmd = " ".join(["/usr/bin/convert", fullfntmppng, fullfn_tiff])
    exec_command(cmd, "3", fn)

    # Create EPS from SVG
    cmd = " ".join(["/usr/bin/inkscape", "-E", fullfn_eps,  fullfnsvg, "--export-area-page","--export-text-to-path", "--export-ignore-filters"])
    exec_command(cmd, "4", fn)

    # Compress PNG (lossless)
    cmd = " ".join(["/usr/bin/pngcrush", "-res", "300", fullfntmppng, fullfnpng1])
    exec_command(cmd, "5", fn)

    # Create EMF from SVG
    cmd = " ".join(["/usr/bin/inkscape", "--file", fullfnsvg, "--export-emf", fullfnemf])
    exec_command(cmd, "6", fn)

writestatus(fn, "6")

# create a tsv file
f = open(fullfntsv, 'w')
f.write(tsvdata)
f.close()
logging.info("Wrote tsv file: " + fullfntsv)

# get high-res image height and width
try:
    wh_str = "xxx"
    with Image.open(fullfnpng1) as img:
        png_w, png_h = img.size

    wh_str = str(png_w) + 'x' + str(png_h)
    logging.info("wxh string = " + wh_str)
except Exception as exc:
    send_error("high-res image", exc.output )

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
logging.info("")
