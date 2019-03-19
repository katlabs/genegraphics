import json
import sys
from flask import Flask, render_template, request, jsonify, url_for
from flask_restful import Resource, Api
from flask_cors import CORS, cross_origin
from imageproc.celery import app as celery_app
import imageproc.tasks as tasks
import redis
from redis import ConnectionError, ResponseError
import os
import signal
from hashlib import md5
from xml.etree import ElementTree as ET
from pathlib import Path
import mistune


app = Flask(__name__)
CORS(app)
api = Api(app)

@app.route("/")
def genegraphics():
    with open(app.root_path+"/updates.md", "r") as f:
        message = mistune.markdown(f.read())
    return render_template('index.html', tab='description', message=message)


@app.route("/<tab>")
def genegraphics_tab(tab):
    with open(app.root_path+"/updates.md", "r") as f:
        message = mistune.markdown(f.read())
    return render_template('index.html', tab=tab, message=message)


@app.route("/tutorials/<tutorial_num>")
def tutorials(tutorial_num):
    template_name = "tutorial"+tutorial_num+".html"
    return render_template(template_name)


@app.route("/export", methods=['POST'])
def export():

    data = json.loads(request.data.decode())
    filetype = data["filetype"]
    tsvdata = data["tsvdata"]
    svgdata = data["svgdata"]

    # return on malformed xml
    err = checkXml(svgdata)
    if err is not "Success":
        app.logger.error("Bad XML")
        return jsonify({}),500, {'Message': 'Invalid data receieved. The request cannot be processed.'}

    # check if redis is running
    rs = redis.Redis("localhost")
    try:
        rs.ping()
    except ConnectionError:
        app.logger.error("Redis server not running.")
        return jsonify({}),500, {'Message': 'The server had a problem exporting. Please try again in a few minutes.'}
    except ResponseError as e:
        if str(e) == "NOAUTH Authentication required.":
            # Expected error -redis is running
            pass
        else:
            # Don't expect another ResponseError
            app.logger.error("Unexpected Redis response error.")
            app.logger.error(str(e))
            return jsonify({}),500, {'Message': 'The server had a problem exporting. Please try again in a few minutes.'}

    # check if celery worker is running
    workers_here = celery_app.control.inspect().active()
    if not workers_here:
        app.logger.error('No running Celery workers were found.')
        return jsonify({}),500, {'Message': 'The server had a problem exporting. Please try again in a few minutes.'}

    # get temp folder path (create it if it doesn't exist)
    fld = Path(__file__).parent.joinpath('static','userimgs').resolve()
    fld.mkdir(exist_ok=True)

    # create filename from hash function
    filenamehash = md5(svgdata.encode('utf-8')).hexdigest()
    output_file = fld.joinpath(filenamehash + "." + filetype.lower())
    
    # if the file exists, just return the path
    if output_file.is_file():
        return jsonify({}),202, {'FilePath': url_for('static', filename='userimgs/' + str(output_file.name))}
    # else run the task and return the task id
    else:
        task = tasks.process_session.delay(filetype, tsvdata, svgdata, str(output_file))
        return jsonify({}),202, {'TaskStatus': url_for('exportstatus',
                                                 task_id=task.id)}


@app.route("/exportstatus/<task_id>")
def exportstatus(task_id):
    task = tasks.process_session.AsyncResult(task_id)
    if task.state == 'PENDING':
        # job pending
        response = {
            'state': task.state,
            'current': 0,
            'total': 1,
            'message': 'Pending...'
        }
    elif task.state != 'FAILURE':
        # job started, retried or successful.
        response = {
            'state': task.state,
            'current': task.info.get('current', 0),
            'total': task.info.get('total', 1),
            'message': task.info.get('message', '')
        }
        if task.info['complete']:

            result_filename = Path(task.info['result']).name
            response['result'] = url_for('static', filename='userimgs/' + 
                                         result_filename)

            task.forget() # forget the task when we get a result
                          # results will be lost if the js is
                          # unsuccessful getting the http response

    else:
        # job failed & reached retry limit
        print("Task failed: "+task.info, file=sys.stderr)
        response = {
            'state': task.state,
            'current': 1,
            'total': 1,
            'message': str(task.info),
        }
        task.forget()

    return jsonify(response)

def checkXml(svgdata):

    try:
        ET.fromstring(svgdata.encode('utf-8'))
        return "Success"
    except:
        return "Malformed XML data received."


if __name__ == '__main__':
    app.run(debug=True,port=5002)
