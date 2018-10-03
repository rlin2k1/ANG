""" return_map.py
Map Return!

Author(s):
    Roy Lin

Date Created:
    August 16th, 2018
"""
# ---------------------------------------------------------------------------- #
# For Chrome
# ---------------------------------------------------------------------------- #
import webbrowser

def open_long_distance(start, end):
    url = 'https://www.google.com/maps/dir/' + start + '/' + end

    # MacOS
    chrome_path = 'open -a /Applications/Google\ Chrome.app %s'

    # Windows
    # chrome_path = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s'

    # Linux
    # chrome_path = '/usr/bin/google-chrome %s'

    webbrowser.get(chrome_path).open(url)

# ---------------------------------------------------------------------------- #
# Connect to the PostgreSQL Database: northrop_grumman
# ---------------------------------------------------------------------------- #
import psycopg2 #Import libpq Wrapper
import sys #System

connect_query = "dbname=northrop_grumman"
conn = psycopg2.connect(connect_query) #Connect to an existing database
cur = conn.cursor() #Open a cursor to perform a database operation

def return_destination_table(table_name):
    cur.execute("SELECT * FROM " + table_name + " WHERE id = '" + sys.argv[1] + "';") #Query the database and obtain data as Python Objects
    conn.commit() #Make the changes to the database persistant
    return cur.fetchall()

def return_starting_table(table_name):
    cur.execute("SELECT * FROM " + table_name + " WHERE id = '" + sys.argv[2] + "';") #Query the database and obtain data as Python Objects
    conn.commit() #Make the changes to the database persistant
    return cur.fetchall()
# ---------------------------------------------------------------------------- #
# Path Finding Algorithm
# ---------------------------------------------------------------------------- #
import matplotlib.pyplot as plt #MatPlotLib Plots
import matplotlib.image as mpimg #Get the MatPlotLib Plot as an Image
from PIL import Image #Image Opening Function
import networkx as nx #Path Finding Algorithm

# ---------------------------------------------------------------------------- #
# Lists for Rooms and Location for Coordinates
# ---------------------------------------------------------------------------- #
wh_31_1 = ['enter','p1','100','102','113','114','restroom1','103','104','105','115','116','106','107','stairs', '108','117','restroom2','1132','109','110','111','112','elevator', '100','p2','enter']
wh_31_2 = ['enter','p1','200','202','213','214','restroom1','203','204','205','215','216','206','207','stairs', '208','217','restroom2','1132','209','210','211','212','elevator', '200','p2','enter']

ng_room_dict = {}
ng_room_dict["WH-31-1.jpg"] = wh_31_1
ng_room_dict["WH-31-2.jpg"] = wh_31_2

location =[(100,590),(190,590),(190,470),(270,470),(270,470),(400,470),(400,470),(473,470),(585,470),
           (585,470),(585,350),(585,300),(585,235),(585,180),(540,180),(498,180),(400,180),(400,180),
           (340,180),(250,180),(190,180),(190,253),(190,310),(190,410),(190,470),(190,590),(100,590)]

def path_find(path_to_map, starting_room, ending_room):
    rooms = ng_room_dict[path_to_map] #Get Proper Room Definitions
    # ---------------------------------------------------------------------------- #
    # Create Graph
    # ---------------------------------------------------------------------------- #
    G = nx.Graph()
    # ---------------------------------------------------------------------------- #
    # Create Dictionary of rooms and coordinates
    # ---------------------------------------------------------------------------- #
    i = 0
    coords = []
    coords.append(i)
    while i <= len(rooms):
        i = i + 1
        coords.append(i)
    nodes = dict(zip(coords,location))
    r_nodes = dict(zip(coords,rooms))
    G.add_nodes_from(nodes.keys())
    for n,p in nodes.items():
        G.node[n]['pos']=p
    # ---------------------------------------------------------------------------- #
    # Input start room and end room based(Inputs must be inside rooms List)
    # ---------------------------------------------------------------------------- #
    start_room = str(starting_room)
    end_room = str(ending_room)
    start = 0
    end = 0
    for key,val in r_nodes.items():
        if val == start_room:
            start = int(key)
        if val == end_room:
            end = int(key)
    # ---------------------------------------------------------------------------- #
    # Create nodes and paths in graph
    # ---------------------------------------------------------------------------- #
    pos = nx.get_node_attributes(G,'pos')
    G.add_path(nodes.keys())
    # ---------------------------------------------------------------------------- #
    # Compute shortest path from start to end
    # ---------------------------------------------------------------------------- #
    path = nx.shortest_path(G,source = start, target = end)
    el_one= list(path)
    el = list(path)
    del el[0]
    el_two = el
    path_edges = list(zip(el_one,el_two)) 
    # ---------------------------------------------------------------------------- #
    # Plot figure and draw graph
    # ---------------------------------------------------------------------------- #
    plt.figure(dpi = 200)
    img = mpimg.imread('./MAPS/' + path_to_map)
    #img = Image.open('C:/Users/mighe/Documents/Python_Scripts_37/office-floor-plans_1.jpg')
    plt.imshow(img)

    nx.draw(G,pos, node_color='w',edge_color='w',node_size = 0.01, width = 0.05)
    nx.draw_networkx_nodes(G,pos,nodelist=path,node_color='b',edge_color='r',node_size=10, width=3)
    nx.draw_networkx_edges(G,pos,edgelist=path_edges,edge_color='r',width=3)
    plt.axis('off')

    plt.savefig("./MAPS/" + path_to_map + "_ROUTE.jpg", dpi= 1200)
    #img.save('C:/Users/mighe/Documents/Python_Scripts_37/test3.jpg')
    map = "./MAPS/" + path_to_map + "_ROUTE.jpg"
    return map #Returns an image

# ---------------------------------------------------------------------------- #
# Start Main Function
# ---------------------------------------------------------------------------- #
def main():
    destination = return_destination_table("employees")
    print(len(destination), end='')
    if(len(destination) == 0):
        return
    starting = return_starting_table("employees")
    if(len(starting) == 0):
        return
    destination = destination[0]
    starting = starting[0]
    print("Name: " + starting[1] + "<br>" + "Phone: " + starting[6] + "<br>" + "Email: " + starting[7] + "<br>" + "Office: " + starting[2] + "<br>" + starting[3] + "/" + starting[4] + "/" + starting[5])

    if(destination[2] != starting[2]): #If the SITE is DIFFERENT
        #Open Up Google Chrome To Do Its Thang!
        destination_input = "Northrop+Grumman+" + destination[2].replace(" ","+") #DESTINATION
        starting_input = "Northrop+Grumman+" + starting[2].replace(" ","+") #STARTING
        open_long_distance(destination_input, starting_input) #OPEN UP GOOGLE MAPS!
    elif( (destination[3] == starting[3]) and (destination[4] == starting[4]) ): #IF THEY ARE ON THE SAME FLOOR
        print(destination[5])
        print(starting[5])
        path = starting[3] + '-' + starting[4] + '.jpg' #OPEN MAP OF SAME FLOOR
        image = path_find(path, destination[5], starting[5]) #OPEN PATH FIND FROM START ROOM TO END ROOM
        show1 = Image.open(image) #OPEN UP LAST IMAGE - TO BE SHOWN SECOND -> TO DESTINATION
        show1.show() #SHOW!
        return
    elif((destination[3] == starting[3])): #IF THEY ARE NOT ON THE SAME FLOOR, BUT SAME BUILDING
        path1 = destination[3] + '-' + destination[4] + '.jpg' #OPEN UP STARTING FLOOR
        path2 = starting[3] + '-' + starting[4] + '.jpg' #OPEN UP ENDING FLOOR
        image1 = None
        image2 = None
        if(sys.argv[3] == "True"):
            image1 = path_find(path1, destination[5], "elevator") #ROUTE FROM START TO ELEVATOR
            image2 = path_find(path2, "elevator", starting[5]) #ROUTE FROM ELEVATOR TO DESTINATION
        else:
            image1 = path_find(path1, destination[5], "stairs") #ROUTE FROM START TO STAIRS
            image2 = path_find(path2, "stairs", starting[5]) #ROUTE FROM STAIRS TO ELEVATOR
        show1 = Image.open(image2) #OPEN UP LAST IMAGE - TO BE SHOWN SECOND -> TO DESTINATION
        show1.show() #SHOW!
        show2 = Image.open(image1) #OPEN UP FIRST IMAGE - TO BE SHOWN FIRST -> TO ELEVATOR/STAIRS
        show2.show()
        return
    else:
        print("NO POSSIBLE ROUTES: DIFFERENT BUILDING IN SAME SITE")
        #Different Building, Same SITE Implementation Here

    cur.close() #Close communication with the database
    conn.close()
    return

if __name__ == '__main__':
    main()