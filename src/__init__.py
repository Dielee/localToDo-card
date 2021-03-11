from server import server
from util import checkRunMode, createDBconnection, initDB

def main():
    checkRunMode()

    conn = createDBconnection()
    initDB(conn)
    conn.close()

    server()

if __name__ == "__main__":
    main()