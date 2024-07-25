(() => {
    const modules = {
        './src/b.js'(module) {
            module.exports = n => {
                return n * n;
            };
        }, './src/a.js'(module) {
            const b = require("./src/b.js");
            module.exports = n => {
                return n + b(n);
            };
        }, './src/index.js'(module) {
            const a = require("./src/a.js");
            const b = require("./src/b.js");
            console.log('Hello World');
            const num = 2;
            console.log(a(num));
            console.log(b(num));
        }
    }
    const cache = {}
    const require = (id) => {
        const cacheModules = cache[id]
        if (cacheModules) return cacheModules.exports
        const module = cache[id] = {
            exports: {}
        }

        modules[id](module, module.exports, require)
        return module.exports
    }

    const a = require("./src/a.js");
    const b = require("./src/b.js");
    console.log('Hello World');
    const num = 2;
    console.log(a(num));
    console.log(b(num));
})()