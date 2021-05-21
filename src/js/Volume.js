// #package js/main

// #include Gradient.js
// #include WebGL.js
// #include TransferFunctionWidget.js

class Volume {

    constructor(gl, reader, options) {

        Object.assign(this, {
            ready: false
        }, options);

        this._gl = gl;
        this._reader = reader;

        this.meta       = null;
        this.modalities = null;
        this.blocks     = null;
        this._texture   = null;
    }

    readMetadata(handlers) {
        if (!this._reader) {
            return;
        }
        this.ready = false;
        this._reader.readMetadata({
            onData: data => {
                this.meta = data.meta;
                this.modalities = data.modalities;
                this.blocks = data.blocks;
                handlers.onData && handlers.onData();
            }
        });
    }


    readModality(modalityName, handlers) {
        console.time('readModality');
        if (!this._reader || !this.modalities) {
            return;
        }
        this.ready = false;
        const modality = this.modalities.find(modality => modality.name === modalityName);
        if (!modality) {
            return;
        }
        const dimensions = modality.dimensions;
        const components = modality.components;
        const blocks = this.blocks;
        const clusters = this._reader.clusters;

        const gl = this._gl;
        if (this._texture) {
            gl.deleteTexture(this._texture);
        }
        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, this._texture);

        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // TODO: here read modality format & number of components, ...
        let format, internalFormat;
        if (components === 2) {
             internalFormat = gl.RG8;
             format = gl.RG;
        } else {
             internalFormat = gl.R8;
             format = gl.RED;
        }

        let bins = {};

        //console.log(this._reader.bits);
        //console.log(modality);
        //console.log(modality.components);
        //console.log(blocks);

        gl.texStorage3D(gl.TEXTURE_3D, 1, internalFormat, dimensions.width, dimensions.height, dimensions.depth);
        let remainingBlocks = modality.placements.length;
        modality.placements.forEach(placement => {
            this._reader.readBlock(placement.index, components, {
                onData: data => {
                    const position = placement.position;
                    const block = blocks[placement.index];
                    const blockdim = block.dimensions;

                    //console.log(position);
                    //console.log(block);
                    //console.log(blockdim);
                    //console.log(data);

                    let current = new Uint8Array(data).reduce((rows, key, index) => (index % 2 === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows, []);

                    //console.log(current);

                    current.forEach((elem, index) => {
                       let intensity = elem[0];
                       let gradient = elem[1];

                       //console.log(gradient);

                       let i = index % blockdim.width;
                       let j = Math.floor(index / blockdim.height);

                       if (intensity !== 0 && gradient !== 0) {
                           if ([intensity, gradient] in bins) {
                               let count = bins[[intensity, gradient]][0],
                                   avg_i = bins[[intensity, gradient]][1],
                                   avg_j = bins[[intensity, gradient]][2],
                                   avg_k = bins[[intensity, gradient]][3],
                                   var_i = bins[[intensity, gradient]][4],
                                   var_j = bins[[intensity, gradient]][5],
                                   var_k = bins[[intensity, gradient]][6];
                               let avg_ni = (avg_i * count + (i / blockdim.width)) / (count + 1);
                               let avg_nj = (avg_j * count + (j / blockdim.height)) / (count + 1);
                               let avg_nk = (avg_k * count + (position.z / (modality.placements.length - 1))) / (count + 1);
                               bins[[intensity, gradient]] = [count + 1, avg_ni, avg_nj, avg_nk,
                                   (var_i * count + ((i / blockdim.width) - avg_ni) ** 2) / (count + 1), (var_j * count + ((j / blockdim.height) - avg_nj) ** 2) / (count + 1), (var_k * count + ((position.z / (modality.placements.length - 1)) - avg_nk) ** 2) / (count + 1)];
                           } else {
                               bins[[intensity, gradient]] = [1, i / blockdim.width, j / blockdim.height, position.z / (modality.placements.length - 1), 0, 0, 0];
                           }
                       }
                    });

                    gl.bindTexture(gl.TEXTURE_3D, this._texture);
                    gl.texSubImage3D(gl.TEXTURE_3D, 0,
                        position.x, position.y, position.z,
                        blockdim.width, blockdim.height, blockdim.depth,
                        format, gl.UNSIGNED_BYTE, new Uint8Array(data));
                    remainingBlocks--;
                    if (remainingBlocks === 0) {

                        console.timeEnd('readModality');
                        fetch("/cluster", {method: 'POST', body: JSON.stringify([bins, clusters])})
                            .then(resp => resp.blob())
                            .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                // the filename you want
                                a.download = 'auto-tf.json';
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                alert('Automatic Transfer Function has been generated'); // or you know, something with better UX...
                            })
                            .catch(() => alert('Could not generate Transfer Function!'));

                        this.ready = true;
                        handlers.onLoad && handlers.onLoad();
                    }
                }
            });
        });
    }




    async blobToBase64(blob) {
        return new Promise( resolve => {
            let reader = new FileReader();
            reader.onload = function() {
                let dataUrl = reader.result;
                resolve(dataUrl);
            };
            reader.readAsDataURL(blob);
        });
    }

    async base64ToImage(b64) {
        return new Promise( resolve => {
            let reader = new FileReader();
            let img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = img.naturalHeight;
                canvas.width = img.naturalWidth;
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            img.src = b64;
        });
    }


    async delay(bins) {
        try {
            const request = new Request("/cluster", {method: 'POST', body: JSON.stringify(bins)});
            const response = await fetch(request);
            const a = await response.blob();
            const b = await this.blobToBase64(a);
            const img = await this.base64ToImage(b);
            return img;

        } catch (error) {
            console.error(error);
        }
    }



    getTexture() {
        if (this.ready) {
            return this._texture;
        } else {
            return null;
        }
    }

    setFilter(filter) {
        if (!this._texture) {
            return;
        }

        var gl = this._gl;
        filter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
        gl.bindTexture(gl.TEXTURE_3D, this._texture);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
    }

}
