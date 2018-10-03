""" path_find.py
Path Finder Given Map File -> Start Room + End Room

Author(s):
    Roy Lin

Date Created:
    August 20th, 2018
"""
# ---------------------------------------------------------------------------- #
# Include/Header Information
# ---------------------------------------------------------------------------- #
import sys #System
import matplotlib.pyplot as plt #For Plotting
import matplotlib.image as mpimg #For Getting Images
from PIL import Image #I don't fucking know
import networkx as nx #Path Finding Algorithm

# ---------------------------------------------------------------------------- #
# Create Graph
# ---------------------------------------------------------------------------- #
G = nx.Graph() #Graph Called G

# ---------------------------------------------------------------------------- #
# Lists for Rooms and Location or Coordinates
# ---------------------------------------------------------------------------- #
rooms = ['enter','p1','100','102','113','114','restroom1','103','104','105','115','116','106','107','stairs',
         '108','117','restroom2','1132','109','110','111','112','elevator', '100','p2','enter']#'p3','exit 2']
location =[(100,590),(190,590),(190,470),(270,470),(270,470),(400,470),(400,470),(473,470),(585,470),
           (585,470),(585,350),(585,300),(585,235),(585,180),(540,180),(498,180),(400,180),(400,180),
           (340,180),(250,180),(190,180),(190,253),(190,310),(190,410),(190,470),(190,590),(100,590)]

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
G.add_nodes_from(nodes.keys(), name = 'name')
for n,p in nodes.items():
    G.node[n]['pos']=p

# ---------------------------------------------------------------------------- #
# Input start room and end room based(Inputs must be inside rooms List)
# ---------------------------------------------------------------------------- #
start_room = sys.argv[1]
end_room = sys.argv[2]
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
path = nx.shortest_path(G,source= start, target= end)
end_edge= nx.shortest_path(G,source=start,target=int(end-1))
path_edges=G.edges(end_edge[1:])

# ---------------------------------------------------------------------------- #
# Plot figure and draw graph
# ---------------------------------------------------------------------------- #
plt.figure(dpi = 200)
img = mpimg.imread('WH-31-1.jpg')

plt.imshow(img)

nx.draw(G,pos, node_color='w',edge_color='w',node_size = 0.1, width = 0.2)
nx.draw_networkx_nodes(G,pos,nodelist=path,node_color='b',edge_color='r',node_size=10, width=3)
nx.draw_networkx_edges(G,pos,edgelist=path_edges,edge_color='r',width=3,weight=None)
plt.axis('off')

plt.savefig('WH-31-1TEST.jpg', dpi= 1200)
#img.save('C:/Users/mighe/Documents/Python_Scripts_37/test3.jpg')
image = Image.open('WH-31-1TEST.jpg')
image.show()

exit()