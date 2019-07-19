from __future__ import absolute_import, unicode_literals
from .celery import app
from celery.utils.log import get_task_logger
import time
from PIL import Image
import subprocess
from subprocess import check_output, run, DEVNULL, STDOUT, Popen, PIPE
import shlex
import sys
from pathlib import Path

TIMEOUT = 90

logger = get_task_logger(__name__)

@app.task(bind=True)
def process_session(self, ft, tsv, svg, output_file):
    
    progress_data = {'message': '',
                     'current':0,
                     'total':1, 
                     'result': None,
                     'complete': False}

    progress_data["message"] = update_message(progress_data)
    
    # Get the basename for the output file
    output_path = Path(output_file)
    filehash = output_path.name.split('.')[0]
    save_dir = output_path.parent

    if ft == "TSV":
        self.update_state(state="PROGRESS", meta=progress_data)
        with open(output_file, 'w') as outfile:
            outfile.write(tsv)
        progress_data["result"] = output_file
        progress_data["current"] = progress_data["current"]+1
        progress_data["message"] = update_message(progress_data)
        self.update_state(state="PROGRESS", meta=progress_data)

    elif ft == "SVG":
        self.update_state(state="PROGRESS", meta=progress_data)
        progress_data = make_svg(self, 
                                 svg, 
                                 output_file, 
                                 progress_data)

    elif ft == "PNG":
        progress_data["total"] = 4
        progress_data["message"] = update_message(progress_data)
        self.update_state(state="PROGRESS", meta=progress_data)
        progress_data = html_to_png(self, 
                                    svg, 
                                    output_file, 
                                    progress_data)

    elif ft == "EMF":
        progress_data["total"] = 2
        progress_data["message"] = update_message(progress_data)
        self.update_state(state="PROGRESS", meta=progress_data)
        progress_data = svg_to_emf(self, 
                                   svg, 
                                   output_file, 
                                   progress_data)

    elif ft == "EPS":
        progress_data["total"] = 2
        progress_data["message"] = update_message(progress_data)
        self.update_state(state="PROGRESS", meta=progress_data)
        progress_data = svg_to_eps(self, 
                                   svg, 
                                   output_file,
                                   progress_data)

    elif ft == "TIFF":
        progress_data["total"] = 5
        progress_data["message"] = update_message(progress_data)
        self.update_state(state="PROGRESS", meta=progress_data)
        progress_data = png_to_tiff(self, 
                                    svg, 
                                    output_file, 
                                    progress_data)

    else:
        logger.error("Not a valid filetype: " + ft)
        progress_data["message"] = update_message(progress_data)
        return progress_data

    logger.debug(progress_data["result"])
    logger.debug(output_file)
    if progress_data["result"] == output_file:
        progress_data["complete"] = True

    return progress_data

def update_message(progress_data):
    if progress_data["current"] < progress_data["total"]:
        return "Step {} of {} complete.".format(
            progress_data["current"],
            progress_data["total"])
    else:
        return "Task complete!"

def make_svg(self, svg, svg_file, progress_data):
    """ Make svg file if it doesn't exist 
        
        and return the file name. If it exists, 
        just return the file name.
    """

    svg_path = Path(svg_file)
    # Check if svg file exists
    if not svg_path.is_file():
        # Create the svg file
        with open(svg_file, 'w') as outfile:
            outfile.write(svg)
    else:
        svg_file = str(svg_path)
    progress_data["current"] = progress_data["current"]+1
    progress_data["message"] = update_message(progress_data)
    progress_data["result"] = svg_file
    self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data

def make_html(self, svg, html_file, progress_data):
    """ Make html file if it doesn't exist 
    
    and return the file name. If it exists, 
    just return the file name.
    """

    # Get html output name and save dir
    html_path = Path(html_file)
    # Check if html file exists
    if not html_path.is_file():
        # Create the html file
        with open(html_file, 'w') as outfile:
            outfile.write(
"""<!DOCTYPE html>
  <html>
    <head>
      <style>
        body {font-family:Arial;}
      </style>
    </head>
    <body>
    """)
            outfile.write(svg)
            outfile.write("""
    </body>
  </html>""")
    else:
        html_file = str(html_path)
    
    progress_data["current"] = progress_data["current"]+1
    progress_data["message"] = update_message(progress_data)
    progress_data["result"] = html_file
    self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data

def html_to_png(self, svg, png_file, progress_data):
    
    png_path = Path(png_file)
    filehash = png_path.name.split('.')[0]
    save_dir = png_path.parent
    progress_data = make_html(self, 
                          svg, 
                          str(save_dir.joinpath(filehash+'.html')),
                          progress_data)
    html_file = progress_data["result"]
    pngcrush_temp = str(save_dir.joinpath(filehash+"-temp.png"))
    # Create a png from html file
    cmd1 = 'xvfb-run -a -e /dev/stderr --server-args="-screen 0, 1920x1024x24" /home/ubuntu/bin/wkhtmltoimage --zoom 3 -f png --use-xserver {} {}'.format(html_file, png_file)
    cmd2 = " ".join(["/usr/bin/convert", png_file, "-blur", "1x0.2", png_file])
    cmd3 = " ".join(["/usr/bin/pngcrush","-ow", "-res", "300", png_file, pngcrush_temp])
    cmds = [cmd1, cmd2, cmd3]
    for i, cmd in enumerate(cmds):
        output = check_output(shlex.split(cmd), stderr=STDOUT, timeout=TIMEOUT)
        if output:
            logger.info("cmd" + str(i) + ": " + str(output))
        progress_data["current"] = progress_data["current"]+1
        progress_data["message"] = update_message(progress_data)
        progress_data["result"] = png_file
        self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data

def svg_to_emf(self, svg, emf_file, progress_data):
    
    emf_path = Path(emf_file)
    filehash = emf_path.name.split('.')[0]
    save_dir = emf_path.parent
    progress_data = make_svg(self, 
                             svg, 
                             str(save_dir.joinpath(filehash+'.svg')),
                             progress_data)
    svg_file = progress_data["result"]
    # Make EMF file from SVG file
    cmd = " ".join(["/usr/bin/inkscape", "--file", svg_file, "--export-emf", emf_file])
    output = check_output(shlex.split(cmd), stderr=STDOUT, timeout=TIMEOUT)
    if output:
        logger.info("cmd" + cmd + ": " + str(output))

    progress_data["current"] = progress_data["current"]+1
    progress_data["message"] = update_message(progress_data)
    progress_data["result"] = emf_file
    self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data

def svg_to_eps(self, svg, eps_file, progress_data):
    
    eps_path = Path(eps_file)
    filehash = eps_path.name.split('.')[0]
    save_dir = eps_path.parent
    progress_data = make_svg(self, 
                             svg, 
                             str(save_dir.joinpath(filehash+'.svg')),
                             progress_data)
    svg_file = progress_data["result"]
    # Make EPS file from SVG file
    cmd = " ".join(["/usr/bin/inkscape", "-E", eps_file,  svg_file, "--export-area-page","--export-text-to-path", "--export-ignore-filters"])
    output = check_output(shlex.split(cmd), stderr=STDOUT, timeout=TIMEOUT)
    if output:
        logger.info("cmd" + cmd + ": " + str(output)) 
    progress_data["current"] = progress_data["current"]+1
    progress_data["message"] = update_message(progress_data)
    progress_data["result"] = eps_file
    self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data


def png_to_tiff(self, svg, tiff_file, progress_data):

    tiff_path = Path(tiff_file)
    filehash = tiff_path.name.split('.')[0]
    save_dir = tiff_path.parent
    progress_data = html_to_png(self, 
                                svg,
                                str(save_dir.joinpath(filehash+'.png')),
                                progress_data)
    png_file = progress_data["result"]
    # Make TIFF file from PNG file
    cmd = " ".join(["/usr/bin/convert", png_file, tiff_file])
    output = check_output(shlex.split(cmd), stderr=STDOUT, timeout=TIMEOUT)
    if output:
        logger.info("cmd" + cmd + ": " + str(output))
    progress_data["current"] = progress_data["current"]+1
    progress_data["message"] = update_message(progress_data)
    progress_data["result"] = tiff_file
    self.update_state(state="PROGRESS", meta=progress_data)

    return progress_data
