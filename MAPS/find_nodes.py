""" find_nodes.py
Dictionary that maps (Room Number) -> Nodes

Author(s):
    Roy Lin

Date Created:
    August 19th, 2018
"""
# ---------------------------------------------------------------------------- #
# Include/Headers
# ---------------------------------------------------------------------------- #
import io
import os
# ---------------------------------------------------------------------------- #
# Imports the Google Cloud Client Library
# ---------------------------------------------------------------------------- #
from google.cloud import vision
from google.cloud.vision import types

def midpoint(datapoints):
    return tuple(((datapoints[0].x + datapoints[1].x) / 2, (datapoints[1].y + datapoints[2].y) / 2))

def detect_text(path):
    """
    Detects Text in a File
    
    Args:
        path (string): Path to the Map File
    Returns:
        (Dictionary): Maps Room Numbers in the File to the File Coordinates
    """
    res_dict = {} #Dictionary to Be Returned!
    client = vision.ImageAnnotatorClient()

    with io.open(path, 'rb') as image_file:
        content = image_file.read()

    image = vision.types.Image(content=content)

    response = client.text_detection(image=image)
    texts = response.text_annotations

    for text in texts:
        if(text.description.isdigit()):
            res_dict[int(text.description.encode("utf-8"))] = midpoint(text.bounding_poly.vertices) #Encode Gets Rid of 'u and Change Keys to INTS -> (MAP TO) Midpoint!
        #     print(text.description)
        #     print(text.bounding_poly.vertices)
        #     print(midpoint(text.bounding_poly.vertices))
    return res_dict

def main():
    room_dictionary = detect_text("lays.png")
    print(room_dictionary)
    return

if __name__ == '__main__':
    main()