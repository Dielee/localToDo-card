from flask import Flask, request
import json
import sqlite3
from sqlite3 import Error
import yaml

cfg = None

def main ():

    loadConf()

    conn = createDBconnection()
    initDB(conn)
    conn.close()

    app = Flask(__name__)
    @app.route('/getToDoListItems', methods = ['GET'])
    def getToDoListItems():
        conn = createDBconnection()
        retJson = getDBItems(conn)

        return retJson

    @app.route('/setToDoListItems', methods = ['POST'])
    def setToDoListItems():
        paramsJson = json.loads(request.form.get("commands"))
        
        postType = paramsJson[0]["type"]
        
        if (postType == "item_delete"):
            itemId = paramsJson[0]["args"]["id"]
            deleteItem(itemId, createDBconnection())

        elif (postType == "item_close"):
            itemId = paramsJson[0]["args"]["id"]
            closeItem(itemId, createDBconnection())

        elif (postType == "item_add"):
            content = paramsJson[0]["args"]["content"]
            tempID = paramsJson[0]["temp_id"]
            addItem (content, tempID, createDBconnection())

        return "Done"

    app.run(host='0.0.0.0', debug=False, threaded=True, port=5556)

def addItem (content, tempID, conn):
    sql = ''' INSERT INTO tasks
            VALUES (?, ?, date(), ?, ?) '''
    cur = conn.cursor()
    cur.execute(sql, (0, 0, content, tempID))
    conn.commit()

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

def deleteItem (itemId, conn):
    sql = ''' UPDATE tasks
              SET is_deleted = ?
              WHERE id = ?'''
    cur = conn.cursor()
    cur.execute(sql, (1, itemId))
    conn.commit()


def getDBItems (conn):
    jsonHeader = {  
                    "project": {
                    "id": "Local ToDoList",
                    },
                    "items":
                    []
                 }
    

    jsonStr = json.dumps(jsonHeader)
    jsonJson = json.loads(jsonStr)

    db = conn.cursor()
    rows = db.execute("SELECT * from tasks where is_deleted = 0").fetchall()

    for row in rows:
        jsonJson["items"].append({'checked': row[0], 'is_deleted': row[1], 'date_added': row[2], 'content': row[3], 'id': row[4]})

    conn.close()

    print (json.dumps(jsonJson))

    return json.dumps(jsonJson)


def create_table(conn, sqlQuery):
    try:
        c = conn.cursor()
        c.execute(sqlQuery)
    except Error as e:
        print(e)

def createDBconnection():
        """ create a database connection to a SQLite database """
        conn = None
        try:
            conn = sqlite3.connect(cfg['HaToDo']['dbPath'])
        except Error as e:
            print(e)
        
        return conn

def initDB (conn):
    createItemsTable = """CREATE TABLE IF NOT EXISTS tasks 
        (
            checked int,
            is_deleted int,
            date_added datetime, 
            content text,
            id int PRIMARY KEY
        )"""

    if conn is not None:
        create_table(conn, createItemsTable)
    else:
        print ("Error! cannot create the database connection.")


def loadConf ():
    global cfg
    with open("config.yaml", "r") as ymlfile:
        cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)

if __name__ == '__main__':
    main() 