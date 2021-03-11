from server import server
from util import createDBconnection, initDB

def main():
    conn = createDBconnection()
    initDB(conn)
    conn.close()

    server()

if __name__ == "__main__":
    main()