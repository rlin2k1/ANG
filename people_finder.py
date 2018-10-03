""" people_finder.py
People LookUp in the Database

Author(s):
    Roy Lin

Date Created:
    August 5th, 2018
"""

# ---------------------------------------------------------------------------- #
# Connect to the PostgreSQL Database: northrop_grumman
# ---------------------------------------------------------------------------- #
import psycopg2 #Import libpq Wrapper
import sys #System

connect_query = "dbname=northrop_grumman"
conn = psycopg2.connect(connect_query) #Connect to an existing database
cur = conn.cursor() #Open a cursor to perform a database operation

def return_table(table_name):
    cur.execute("SELECT * FROM " + table_name + " WHERE name = '" + sys.argv[1] + "';") #Query the database and obtain data as Python Objects
    conn.commit()
    employee_list = cur.fetchall()
    if(len(employee_list)):
        return employee_list
    cur.execute("SELECT * FROM " + table_name + " WHERE name ILIKE '%" + sys.argv[1] + "%';") #Query the database and obtain data as Python Objects
    conn.commit() #Make the changes to the database persistant
    return cur.fetchall()

def main():
    employee_table = return_table("employees")
    print(len(employee_table), end='')
    output_string = "";
    for idx, val in enumerate(employee_table):
        output_string = output_string + '|'.join(list(val)) + "?"
    print(output_string[:-1], end='')
    cur.close() #Close communication with the database
    conn.close()
    return

if __name__ == '__main__':
    main()