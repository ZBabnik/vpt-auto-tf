
from sklearn.cluster import KMeans, DBSCAN
from sklearn.neighbors import NearestNeighbors

from PIL import Image

import sys, json, random, colorsys, numpy as np
import math
import pickle
import time

import matplotlib.pyplot as plt

def main():

    start_time = time.time()

    lines = sys.stdin.readlines()
    lines = json.loads(lines[0])
    lines, nof_clusters = lines


    #np_lines = [int(key.split(",")[1]) for key, item in lines.items()]

    #max_grad = np.max(np.array(np_lines))


    lines = dict(filter(lambda item: int(item[1][0]) > 2, lines.items()))
    np_lines = [[item[4], item[5], item[6]] for key, item in lines.items()]

    var_x, var_y, var_z = zip(*np_lines)

    mean_var_x = np.mean(np.array(var_x))
    mean_var_y = np.mean(np.array(var_y))
    mean_var_z = np.mean(np.array(var_z))

    lines = dict(filter(lambda item: item[1][4] < mean_var_x and item[1][5] < mean_var_y and item[1][6] < mean_var_z, lines.items()))
    np_lines = [list(map(int, key.split(","))) + [item[1], item[2], item[3]] for key, item in lines.items()]

    intensities, gradients, mean_x, mean_y, mean_z = zip(*np_lines)
    intensities, gradients = np.array(intensities, dtype=np.float), np.array(gradients, dtype=np.float)
    mean_x, mean_y, mean_z = np.array(mean_x, dtype=np.float), np.array(mean_y, dtype=np.float), np.array(mean_z, dtype=np.float)

    #max_grad = np.max(gradients)

    intensities /= 255.
    gradients /= 255.

    plt.scatter(intensities, gradients, alpha=0.1)
    plt.ylim([0., 1.])
    plt.savefig("scatter_orig.png")
    plt.show()
    plt.clf()


    #print(list(zip(intensities, gradients)))

    #with open("./clust_data", "wb") as out_f:
    #    pickle.dump(list(zip(intensities, gradients, mean_x, mean_y, mean_z)), out_f)

    np_lines = np.array(list(zip(intensities, gradients, mean_x, mean_y, mean_z)))

    #print(np_lines)

    #neigh = NearestNeighbors(n_neighbors=2)
    #nbrs = neigh.fit(np_lines)
    #distances, indices = nbrs.kneighbors(np_lines)

    #distances = np.sort(distances, axis=0)
    #distances = distances[:,1]
    #plt.plot(distances)
    #plt.savefig("adcde.png")
    #plt.show()
    #plt.clf()

    #clustering = AffinityPropagation().fit(np_lines)

    #clustering = DBSCAN(eps=2, min_samples=2).fit(np_lines)

    clustering = KMeans(n_clusters=int(nof_clusters)).fit(np_lines)
    #clustering = DBSCAN(eps=0.01).fit(np_lines)

    #print(clustering)
    #print(dir(clustering))
    #print(set(clustering.labels_.tolist()))
    #print(len(clustering.core_sample_indices_.tolist()))
    #print(len(np_lines))
    #exit()

    nof = len(set(clustering.labels_.tolist()))

    #print(clustering.cluster_centers_)

    #clusterings = [[[], []], [[], []], [[], []], [[], []], [[], []]]
    #print("ABC")
    clusterings = [[[], []] for x in range(len(set(clustering.labels_.tolist())))]
    clustering_offset = [[0, 0] for x in range(len(set(clustering.labels_.tolist())))]
    cluster_count = [0 for x in range(len(set(clustering.labels_.tolist())))]
    #print("DONE_-1")
    for i, (inten, grad) in enumerate(zip(intensities, gradients)):
        clusterings[clustering.labels_[i]][0].append(inten)
        clusterings[clustering.labels_[i]][1].append(grad)
        clustering_offset[clustering.labels_[i]][0] += (math.fabs(inten - clustering.cluster_centers_[clustering.labels_[i]][0]))
        clustering_offset[clustering.labels_[i]][1] += (math.fabs(grad - clustering.cluster_centers_[clustering.labels_[i]][1]))
        cluster_count[clustering.labels_[i]] += 1

    for i in range(len(clustering_offset)):
        clustering_offset[i][0] /= cluster_count[i]
        clustering_offset[i][1] /= cluster_count[i]

    #print("DONE1")

    for i, c_ in enumerate(clusterings):
        hue, saturation, lightness = (i * 360./float(nof)) / 360., (90 + random.random() * 10) / 100., (50 + random.random() * 10) / 100.0
        #print(str(hue)+" "+str(saturation)+" "+str(lightness))
        r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)
        plt.scatter(c_[0], c_[1], c=np.array([[r, g, b] for x in range(len(c_[0]))]), alpha=0.1)
    #plt.axis('off')
    #plt.savefig("scatter_clust.png", bbox_inches='tight', pad_inches=0, transparent=True)
    plt.ylim([0., 1.])
    plt.savefig("scatter_clust.png")


    #img = Image.open("./scatter_clust.png")
    #img = img.resize((256, 256))
    #img.save("./scatter_clust.png")

    #print("DONE2")

    #print([l for l in clustering.labels_])

    transfer_f = []
    #for i, (inten, grad) in enumerate(clusterings):
    #    hue, saturation, lightness = (i * 360./float(nof)) / 360., (90 + random.random() * 10) / 100., (50 + random.random() * 10) / 100.0
    #    r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)
    #    r_idxes = random.sample([x for x in range(len(inten))], min(len(inten), 30))
    #    for x in r_idxes:
    #        transfer_f.append({"position": {"x": inten[x], "y": grad[x]}, "size": {"x": 0.05, "y": 0.05}, "color": {"r": r, "g": g, "b": b, "a": 1}})
    #    #print(inten)
    #    #print(grad)

    #print("DONE 3")

    #print(intensities)
    #print(gradients)
    #print(intensities.shape)
    #print(gradients.shape)
    temp_list = list(zip(intensities.tolist(), gradients.tolist()))

    #print(temp_list)+

    nof_points = 50

    for i in range(nof_points + 1):
        for j in range(nof_points + 1):

            c_x, c_y = (float(i) / float(nof_points)), (float(j) / float(nof_points))
            r_x, r_y = (1. / float(2 * nof_points)), (1. / float(2 * nof_points))

            #print(c_x, c_y)

            # See if any points near
            for k, (inten, grad) in enumerate(temp_list):
                #print(c_x, inten)
                #print(math.fabs(inten - c_x))
                #print(c_y, grad)
                #print(math.fabs(grad - c_y))
                #exit()
                if math.fabs(inten - c_x) <= r_x and math.fabs(grad - c_y) <= r_y:
                    #print(inten, grad)
                    #exit()
                    cluster_idx = clustering.labels_[k]
                    hue, saturation, lightness = (cluster_idx * 360./float(nof)) / 360., (90 + random.random() * 10) / 100., (50 + random.random() * 10) / 100.0
                    r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)

                    transfer_f.append({"position": {"x": c_x, "y": 1. - c_y}, "size": {"x": 2 * r_y, "y": 2 * r_x}, "color": {"r": r, "g": g, "b": b, "a": 0.8}})

                    break

    with open("./test.json", "w") as tf_out:
        json.dump(transfer_f, tf_out)

    #print("DONE4")

    #transfer_f = []
    #for i, (x, y) in enumerate(clustering.cluster_centers_):
    #    hue, saturation, lightness = (i * 360./float(nof)) / 360., (90 + random.random() * 10) / 100., (50 + random.random() * 10) / 100.0
    #    #print(str(hue)+" "+str(saturation)+" "+str(lightness))
    #    r, g, b = colorsys.hls_to_rgb(hue, lightness, saturation)
    #    #print(str(r)+" "+str(g)+" "+str(b)+" \n")
    #    transfer_f.append({"position": {"x": x, "y": y}, "size": {"x": clustering_offset[i][1]*3, "y": clustering_offset[i][0]*6}, "color": {"r": r, "g": g, "b": b, "a": 1}})

    #print("DONE3")

    print(f"Clustering took : {time.time() - start_time} s")


if __name__ == '__main__':
    main()
