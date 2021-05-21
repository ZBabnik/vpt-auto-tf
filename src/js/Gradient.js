// #package js/main


class Gradient {
     create_gradient_kernel(width, height) {

        const gpu = new GPU();
        const settings = {
            output: [width, height, 2],
            constants: {width: width, height: height}
        };
        const gradient = gpu.createKernel(function (z0, z1, z2) {

            let intensity_gradient = 0.0;

            let width = this.constants.width;
            let height = this.constants.height;

            let i = this.thread.x;
            let j = this.thread.y;
            let k = this.thread.z;

            if (k === 0) {
                return z1[j][i];
            }
            if (j > 0 && j < width - 1 &&
                i > 0 && i < height - 1) {

                let a0 = [[z0[j - 1][i - 1], z0[j - 1][i], z0[j - 1][i + 1]],
                    [z0[j][i - 1], z0[j][i], z0[j - 1][i + 1]],
                    [z0[j + 1][i - 1], z0[j + 1][i], z0[j + 1][i + 1]]];
                let a1 = [[z1[j - 1][i - 1], z1[j - 1][i], z1[j - 1][i + 1]],
                    [z1[j][i - 1], z1[j][i], z1[j - 1][i + 1]],
                    [z1[j + 1][i - 1], z1[j + 1][i], z1[j + 1][i + 1]]];
                let a2 = [[z2[j - 1][i - 1], z2[j - 1][i], z2[j - 1][i + 1]],
                    [z2[j][i - 1], z2[j][i], z2[j - 1][i + 1]],
                    [z2[j + 1][i - 1], z2[j + 1][i], z2[j + 1][i + 1]]];

                // Multiply with 3D Sobel kernel
                let G_x = -1. * a0[0][0] + 1. * a2[0][0]
                    - 2. * a0[1][0] + 2. * a2[1][0]
                    - 1. * a0[2][0] + 1. * a2[2][0]
                    - 2. * a0[0][1] + 2. * a2[0][1]
                    - 4. * a0[1][1] + 4. * a2[1][1]
                    - 2. * a0[2][1] + 2. * a2[2][1]
                    - 1. * a0[0][2] + 1. * a2[0][2]
                    - 2. * a0[1][2] + 2. * a2[0][2]
                    - 1. * a0[2][2] + 1. * a2[2][2];
                let G_y = -1. * a0[0][0] - 2. * a2[0][0] - 1. * a2[0][0]
                    + 1. * a0[2][0] + 2. * a1[2][0] + 1. * a2[2][0]
                    - 2. * a0[0][1] - 4. * a1[0][1] - 2. * a2[0][1]
                    + 2. * a0[2][1] + 4. * a1[2][1] + 2. * a2[2][1]
                    - 1. * a0[0][2] - 2. * a1[0][2] - 1. * a2[0][2]
                    + 1. * a0[2][2] + 2. * a1[2][2] + 1. * a2[2][2];
                let G_z = -1. * a0[0][0] - 2. * a1[0][0] - 1. * a2[0][0]
                    - 2. * a0[1][0] - 4. * a1[1][0] - 2. * a2[1][0]
                    - 1. * a0[2][0] - 2. * a1[1][0] - 1. * a2[2][0]
                    + 1. * a0[0][2] + 2. * a1[0][2] + 1. * a2[0][2]
                    + 2. * a0[1][2] + 4. * a1[1][2] + 2. * a2[1][2]
                    + 1. * a0[2][2] + 2. * a1[2][2] + 1. * a2[2][2];

                intensity_gradient = Math.sqrt(Math.pow(G_x, 2) + Math.pow(G_y, 2) + Math.pow(G_z, 2));
            }

            return intensity_gradient;
        }, settings);

        return gradient
    }
}