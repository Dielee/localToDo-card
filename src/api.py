from flask import Flask, request
import json
from util import checkRunMode, createDBconnection

app = Flask(__name__)

cfg = None

@app.before_first_request
def runFirst():
    global cfg
    cfg = checkRunMode()

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
            VALUES (?, ?, date(), ?, ?, ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, (0, 0, content, responsePerson, 0,tempID))
    conn.commit()
    conn.close()

def closeItem (itemId, conn):

    sqlSelect = ''' SELECT checked from tasks where id = ? '''
    cur = conn.cursor()
    cur.execute(sqlSelect, [itemId])

    isChecked = cur.fetchone()[0]

    sqlUpdate = ''' UPDATE tasks
            SET checked = ?
            WHERE id = ?'''

    # Undo done tasks
    if (isChecked == 0):
        cur.execute(sqlUpdate, (1, itemId))
    else:
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
    rows = db.execute("SELECT checked, is_deleted, date_added, content, responsePerson, is_pinned, id  FROM tasks where is_deleted = 0 order by is_pinned desc, date_added").fetchall()
    conn.close()

    for person in cfg['HaToDo']['persons']:
        jsonJson['settings']['persons'].append(person)
    
    for row in rows:
        jsonJson["items"].append({'checked': row[0], 'is_deleted': row[1], 'date_added': row[2], 'content': row[3], 'responsePerson': row[4], 'is_pinned': row[5] ,'id': row[6]})


    return json.dumps(jsonJson)