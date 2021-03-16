from flask import Flask, request
import json
import os
from util import createDBconnection, loadConfFromFile, loadConfFromVar

app = Flask(__name__)
cfg = None

@app.before_first_request
def runFirst():
    global cfg
    runMode = os.environ.get('RUN_IN_DOCKER', False)

    if runMode:
        print("Running in docker mode, load conf from env...")
        cfg = loadConfFromVar()
    else:
        print("Running in other mode, load conf from file...")
        cfg = loadConfFromFile()

@app.route('/getToDoListItems', methods = ['GET'])
def getToDoListItems():
    conn = createDBconnection()
    retJson = getDBItems(conn)

    return retJson

@app.route('/setToDoListItems', methods = ['POST'])
def setToDoListItems():
    paramsJson = json.loads(request.form.get("commands"))
    
    postType = paramsJson[0]["type"]

    print (postType)
    
    if (postType == "item_delete"):
        itemId = paramsJson[0]["args"]["id"]
        deleteItem(itemId, createDBconnection())

    elif (postType == "item_close"):
        itemId = paramsJson[0]["args"]["id"]
        closeItem(itemId, createDBconnection())

    elif (postType == "item_add"):
        content = paramsJson[0]["args"]["content"]
        responsePerson = paramsJson[0]["args"]["responsePerson"]
        tempID = paramsJson[0]["temp_id"]
        addItem(content, tempID, responsePerson, createDBconnection())

    elif (postType == "item_update"):
        content = paramsJson[0]["args"]["content"]
        responsePerson = paramsJson[0]["args"]["responsePerson"]
        tempID = paramsJson[0]["temp_id"]
        updateItem(content, tempID, responsePerson, createDBconnection())

    elif (postType == "item_pin"):
        itemId = paramsJson[0]["args"]["id"]
        pinItem(itemId, createDBconnection())

    return "Done"

def pinItem (itemId, conn):
    sqlSelect = ''' SELECT is_pinned from tasks where id = ? '''
    cur = conn.cursor()
    cur.execute(sqlSelect, [itemId])
    isPinned = cur.fetchone()[0]

    sql = ''' UPDATE tasks set is_pinned = ? WHERE id = ? '''
    
    if (isPinned == 0):
        cur.execute(sql, (1, itemId))
    else:
        cur.execute(sql, (0, itemId))

    conn.commit()
    conn.close()

def updateItem (content, itemId, responsePerson, conn):
    sql = ''' UPDATE tasks set content = ?, responsePerson = ? WHERE id = ? '''
    cur = conn.cursor()
    cur.execute(sql, (content, responsePerson, itemId))
    conn.commit()
    conn.close()

def addItem (content, tempID, responsePerson, conn):
    sql = ''' INSERT INTO tasks (checked, is_deleted, date_added, content, responsePerson, is_pinned, id)
            VALUES (?, ?, datetime(), ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, (0, 0, content, responsePerson, 0,tempID))
    conn.commit()
    conn.close()

def closeItem (itemId, conn):

    sqlSelect = ''' SELECT checked from tasks where id = ? '''
    cur = conn.cursor()
    cur.execute(sqlSelect, [itemId])

    isChecked = cur.fetchone()[0]

    # Undo done tasks
    if (isChecked == 0):
        sqlUpdate = ''' UPDATE tasks
        SET checked = ?, date_closed = datetime()
        WHERE id = ?'''
        cur.execute(sqlUpdate, (1, itemId))
    else:
        sqlUpdate = ''' UPDATE tasks
        SET checked = ?, date_closed = null
        WHERE id = ?'''
        cur.execute(sqlUpdate, (0, itemId))
    
    conn.commit()
    conn.close()

def deleteItem (itemId, conn):
    sql = ''' UPDATE tasks
              SET is_deleted = ?
              WHERE id = ?'''
    cur = conn.cursor()
    cur.execute(sql, (1, itemId))
    conn.commit()
    conn.close()


def getDBItems (conn):
    jsonHeader = {  
                    "project": 
                        {
                            "id": "Local ToDoList"
                        },
                    "settings": 
                        {
                            "language": cfg['HaToDo']['language'],
                            "persons": []
                        },
                    "items": []
                 }
    

    jsonStr = json.dumps(jsonHeader)
    jsonJson = json.loads(jsonStr)

    db = conn.cursor()
    rows = db.execute("SELECT checked, is_deleted, date_added, date_closed, content, responsePerson, is_pinned, id  FROM tasks where is_deleted = 0 order by is_pinned desc, date_added").fetchall()
    conn.close()

    for person in cfg['HaToDo']['persons']:
        jsonJson['settings']['persons'].append(person)
    
    for row in rows:
        jsonJson["items"].append({'checked': row[0], 'is_deleted': row[1], 'date_added': row[2], 'date_closed': row[3], 'content': row[4], 'responsePerson': row[5], 'is_pinned': row[6] ,'id': row[7]})


    return json.dumps(jsonJson)