// #package js/main

// #include AbstractReader.js

class RAWReader extends AbstractReader {

constructor(loader, options) {
    super(loader);

    Object.assign(this, {
        width       : 0,
        height      : 0,
        depth       : 0,
        bits        : 8,
        clusters    : 4,
    }, options);
}

readMetadata(handlers) {
    let metadata = {
        meta: {
            version: 1
        },
        modalities: [
            {
                name: 'default',
                dimensions: {
                    width  : this.width,
                    height : this.height,
                    depth  : this.depth
                },
                transform: {
                    matrix: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ]
                },
                components: 2,
                bits: this.bits,
                placements: []
            }
        ],
        blocks: []
    };

    for (let i = 0; i < this.depth; i++) {
        metadata.modalities[0].placements.push({
            index: i,
            position: { x: 0, y: 0, z: i }
        });

        metadata.blocks.push({
            url: 'default',
            format: 'raw',
            dimensions: {
                width  : this.width,
                height : this.height,
                depth  : 1
            }
        });
    }

    handlers.onData && handlers.onData(metadata);
}

readBlock(block, components, handlers) {
    const sliceBytes = this.width * this.height * (this.bits / 8);
    const start = block * components * sliceBytes;
    const end = (block + 1) * components * sliceBytes;
    this._loader.readData(start, end, {
        onData: data => {
            handlers.onData && handlers.onData(data);
        }
    });
}

}
