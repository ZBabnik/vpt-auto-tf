
import os
import argparse
import struct

import numpy as np

from scipy.ndimage import sobel

import matplotlib.pyplot as plt

file_dir = os.path.dirname(__file__)

argparser = argparse.ArgumentParser()
argparser.add_argument("input", metavar="INFILE", type=str, help="Location of RAW volumetric input data")
argparser.add_argument("x", metavar="X", type=int, help="X-dimensionality")
argparser.add_argument("y", metavar="Y", type=int, help="Y-dimensionality")
argparser.add_argument("z", metavar="Z", type=int, help="Z-dimensionality")
arguments = argparser.parse_args()


if __name__ == "__main__":

    in_loc = arguments.input
    x_dim = arguments.x
    y_dim = arguments.y
    z_dim = arguments.z

    file_name = os.path.basename(in_loc)
    path_name = in_loc.replace(file_name, "")

    intensities = None
    with open(in_loc, "rb") as in_file:
        intensities = np.array([x for x in in_file.read()], dtype=np.float).reshape(x_dim, y_dim, z_dim)

    g_x, g_y, g_z = np.gradient(intensities)
    grad = np.abs(sobel(intensities))
    #grad = np.sqrt(g_x**2 + g_y**2 + g_z**2)
    grad *= 255 / np.max(grad)

    #intensities /= 255.
    #print(np.max(intensities))
    #grad /= 255.
    #print(np.max(grad))

    #plt.scatter(intensities, grad, alpha=0.1)
    #plt.savefig("scatter_orig.png")
    #plt.show()

    all_v = []
    for inten, grad in zip(intensities.flatten().tolist(), grad.flatten().tolist()):
        all_v.append(int(inten))
        all_v.append(int(grad))

    all_v = [struct.pack("=B", x) for x in all_v]

    with open(os.path.join(path_name + file_name.split(".")[0]+"_w_grad.raw"), "wb") as out:
        out.writelines(all_v)

