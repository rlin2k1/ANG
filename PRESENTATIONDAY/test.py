import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.patches import FancyArrowPatch
from PIL import Image
import networkx as nx


#pos = {0:[10,10], 1:[300,300], 2:[800.800]}
#coor = {0:'(585,230)'}
#def pfinder(start,end):
'''start== start room eg. 100 or 'enter', end == end room eg. 110 or 'stairs' '''


''' Lists for rooms and location or coordinates'''

rooms = ['enter','p1',100,102,113,114,'restroom1',103,104,105,115,116,106,107,'stairs',
         108,117,'restroom2','113b',109,110,111,112,'elevator', 'reception','p2','enter']#'p3','exit 2']
location =[(100,590),(190,590),(190,470),(270,470),(270,470),(400,470),(400,470),(473,470),(585,470),
           (585,470),(585,350),(585,300),(585,235),(585,180),(540,180),(498,180),(400,180),(400,180),
           (340,180),(250,180),(190,180),(190,253),(190,310),(190,410),(190,470),(190,590),(100,590)]
#nodes = dict(zip(rooms,location))

''' Create Graph'''

G = nx.DiGraph()

''' Create Dictionary of rooms and coordinates'''
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


'''Input start room and end room based(inuputs must be inside rooms List)'''
n = int(5)
start_room = input("Start room:")
if type(start_room) != type(n):
    print("Are you inputing text? yes or no?")
    Yes_no = str(input(" Yes or no?:"))
    if Yes_no == 'yes':
        start_room = str(start_room)
        print("string")
    elif Yes_no == 'no':
        start_room =int(start_room)
        print("integer")
    
end_room = input("End room:")
if type(end_room) != type(n):
    print("Are you inputing text? yes or no?")
    Yes_no = str(input(" Yes or no?:"))
    if Yes_no == 'yes':
        end_room = str(end_room)
        print("string")
    elif Yes_no == 'no':
        end_room=int(end_room)
        print("integer")

for key,val in r_nodes.items():
    if val == start_room:
        start = int(key)
        print(start)
    if val == end_room:
        end = int(key)
        print(end)

'''Create nodes and paths in graph'''

pos = nx.get_node_attributes(G,'pos')
G.add_path(nodes.keys())

''' Comput shortest path from start to end'''

path = nx.shortest_path(G,source = start, target = end)
#path = nx.bidirectional_dijkstra(G,start,end)
#paths = nx.shortest_simple_paths(G,start,end)
#end_edge= nx.shortest_path(G,source = int(start-1), target = int(end-1))
print(path)
el_one= list(path)
print(el_one)
el = list(path)
del el[0]
#el = el[:len(el)-5]
el_two = el
#path = path[1:len(path)-5]
print(el)
print(el_two)
path_edges = list(zip(el_one,el_two)) 
#print(end_edge[start:])
#path_edges=G.edges(end_edge[1:])
#G.add_edges_from(end_edge)
#path_edges=filter(node_edges,lambda x: x[0]< end)
print(path_edges)
#G.remove_edge(end,int(end+1))
#path_edges = zip(path,path[0:])
#degree = nx.degree(G)
#print (degree)
#nx.draw_network_nodes(G,pos)

''' Plot figure and draw graph'''

plt.figure(dpi = 200)
img = mpimg.imread('WH-31-1.jpg')
#img = Image.open('C:/Users/mighe/Documents/Python_Scripts_37/office-floor-plans_1.jpg')
plt.imshow(img)

nx.draw(G,pos, node_color='w',edge_color='w',node_size = 0.01, width = 0.05)
#nx.draw_networkx_nodes(G,pos,nodelist=path,node_color='b',node_size=10)
#nx.draw_networkx_nodes(G,pos,nodelist=path,node_shape='^',node_color='b',node_size=10)
nx.draw_networkx(G,pos,nodelist=path,node_color='b',node_size=10,edgelist=path_edges,width=2,
                 edge_color='r',arrows=True,arrowstyle='-|>',arrowsize=10,with_labels=False)
#nx.draw_networkx_labels(G,pos,labels = r_nodes.items(), font_size= 16)
plt.axis('off')

plt.savefig('WH-31-1TEST.jpg', dpi= 1200)
#img.save('C:/Users/mighe/Documents/Python_Scripts_37/test3.jpg')
plt.show()