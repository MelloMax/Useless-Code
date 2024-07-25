import path from 'path'
import { fileURLToPath } from 'url'
export default {
    entry: './src/index.js',
    output: {
        path: path.resolve(fileURLToPath(import.meta.url), '../dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    (sourse) => {
                        console.log('loader 1')
                        return sourse.replace('h', 'H')
                    },
                    (sourse) => {
                        console.log('loader 2')
                        return sourse.replace('w', 'W')
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new class {
            constructor() {

            }

            apply(compiler) {

            }
        }

    ]


}