import sqlite3
from sqlite3 import Error
import os
import yaml
import json

cfg = None

def loadConfFromFile ():
    with open("config.yaml", "r") as ymlfile:
        cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)
    return cfg

def loadConfFromVar():
    languageVar = os.environ.get('toDoLanguage', False)
    personsVar = os.environ.get('toDoPersons', "")

    tmpCfg = { "HaToDo": 
            { "dbPath" : "toDoList.db", "webServerPort": "5556", "language": languageVar, "persons": []}}

    jsonCfg = json.dumps(tmpCfg)
    jsonJson = json.loads(jsonCfg)

    for person in personsVar.split(','):
        jsonJson['HaToDo']['persons'].append(person)
    
    cfg = jsonJson
    return cfg

def checkRunMode():
    runMode = os.environ.get('RUN_IN_DOCKER', False)

    if runMode:
        cfg = loadConfFromVar()
    else:
        cfg = loadConfFromFile()
    
    return cfg

def createDBconnection():
        """ create a database connection to a SQLite database """
        cfg = checkRunMode()
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
            date_closed datetime,
            content text,
            responsePerson text,
            is_pinned int,
            id int PRIMARY KEY
        )"""

    if conn is not None:
        create_table(conn, createItemsTable)
    else:
        print ("Error! cannot create the database connection.")

def create_table(conn, sqlQuery):
    try:
        c = conn.cursor()
        c.execute(sqlQuery)
    except Error as e:
        print(e)