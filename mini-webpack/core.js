import {SyncHook} from 'tapable'
import fs from 'node:fs'
import path from 'node:path'

import * as parser from "@babel/parser";
import traverse from '@babel/traverse'
import gen from '@babel/generator'
import type from '@babel/types'

// const code = `function square(n) {
//   return n * n;
// }
// square(2)
// `;

// const ast = parser.parse(code);

// console.log('ast里面有什么')
// console.log(ast)

// traverse.default(ast, {
//     Identifier(path) {
//         if(path.isIdentifier({ name: 'n' })) {
//             path.node.name = 'x'
//         }
//     },
//     CallExpression(path) {
//         console.log('call', path.node)
//     }
// });

// const { code: resolveCode } = gen.default(ast)
// console.log('finally code', resolveCode)

export const miniWebpack = (options) => {
    const compiler = new Compiler(options)

    // 插件
    if (Array.isArray(options.plugins)) {
        for (const {apply} of options.plugins) {
            apply(compiler)
        }
    }


    return compiler
}


// 编译器
class Compiler {
    constructor(options) {
        this.options = options
        this.hooks = {
            run: new SyncHook(),
            done: new SyncHook()
        }
    }

    run(callback) {
        this.hooks.run.call()
        this.compile((err, status) => {
            const distPath = this.options.output.path
            callback(err, status)
            Object.keys(status.assets).forEach(fileName => {
                if(!fs.existsSync(distPath)) {
                    fs.mkdir(distPath, () => {
                        console.log('文件已创建')
                    })
                }
                const filePath = path.join(distPath, fileName)
                fs.writeFileSync(filePath, status.assets[fileName], 'utf-8')
            })
            this.hooks.done.call()
        })

    }

    compile(callback) {
        new Compilation(this.options).build(callback)
    }
}


// 编译模块
class Compilation {
    constructor(options) {
        this.options = options
        this.modules = []
        this.chunks = []
        this.assets = {} // 产出资源文件
        this.fileDependencies = []
    }


    build(callback) {

        // 配置人口
        let entry = {}
        if (typeof this.options.entry === 'string') {
            entry.main = this.options.entry
        } else {
            entry = this.options.entry
        }

        // 依赖收集
        console.log('收集入口列表', entry)

        for (let entryName in entry) {
            const entryFilePath = path.posix.join(baseDir, entry[entryName])
            console.log('获取入口路径', entryFilePath)
            // 存储文件路径
            this.fileDependencies.push(entryFilePath)
            // 获取路径模块
            const entryModule = this.buildModule(entryName, entryFilePath)
            // console.log('entryModule', entryModule)
            this.modules.push(entryModule)
            this.chunks.push({
                name: entryName,
                entryModule,
                modules: this.modules.filter(item => item.names.includes(entryName))
            })
        }

        console.log('modules', this.modules)
        console.log('chunks', this.chunks)


        // 产出代码替换阶段
        this.chunks.forEach(chunk => {
            this.assets[this.options.output.filename.replace('[name]', chunk.name)] = getSource(chunk)
        })


        callback(null, {
            chunks: this.chunks,
            modules: this.modules,
            assets: this.assets
        }, this.fileDependencies)

    }


    buildModule(moduleName, modulePath) {
        // 1. 获取源码
        // 2. 创建模块结构记录
        // 3. 匹配module.rules且将源码交给匹配module.use函数
        // 4. ast(抽象语法树)处理 import 和 required 的引入

        // 总的来说是处理源码一系列的转换


        let sourceCode = fs.readFileSync(modulePath, 'utf-8')
        console.log('获取文件源码', sourceCode)


        // 模块结构记录
        const module = {
            id: './' + path.posix.relative(baseDir, modulePath),
            names: [moduleName],
            dependencies: [],
            __source: ''
        }

        // loader
        const loaders = [];
        (this.options.module.rules || []).forEach(rule => {
            if (rule.test.exec(modulePath)) {
                // 如果文件匹配成功将rule的use数组函数存入
                loaders.push(...rule.use)
            }
        })

        console.log('匹配成功后loaders', loaders)

        sourceCode = loaders.reduceRight((sc, fn) => fn(sc), sourceCode)

        console.log('经loader处理后的源码', sourceCode)

        // ast处理
        const ast = parser.parse(sourceCode, {})

        console.log('ast', ast)


        traverse.default(ast, {
            CallExpression: ({node}) => {
                // 查找required关键字
                if (node.callee.name === 'require') {
                    console.log('require find it.')
                    console.log(node.arguments[0])
                    const depPathName = node.arguments[0].value
                    const dirname = path.posix.dirname(modulePath)
                    let depModulePath = path.posix.join(dirname, depPathName)
                    console.log(depModulePath)

                    const ext = this.options.resolve && this.options.resolve.extensions || ['.js']

                    depModulePath = tryExtensions(depModulePath, ext)

                    const depModuleId = './' + path.posix.relative(baseDir, depModulePath)
                    node.arguments = [type.stringLiteral(depModuleId)]

                    console.log('node.arguments', node.arguments)

                    module.dependencies.push({
                        depModuleId,
                        depModulePath
                    })


                }
            }
        })

        const {code} = gen.default(ast)
        module.__source = code

        console.log('module ')
        console.log(module)

        module.dependencies.forEach(dep => {
            const existDepModule = this.modules.find(item => item.id === dep.depModuleId)
            if(existDepModule) {
                existDepModule.names.push(moduleName)
            } else {
                const depModule = this.buildModule(moduleName, dep.depModulePath)
                this.modules.push(depModule)
            }
        })


        return module
    }
}

// utils

const toUnixPath = path => path.replace(/\\/g, '/')
const baseDir = toUnixPath(process.cwd())
console.log('baseDir', process.cwd(), baseDir)

const tryExtensions = (depPath, extensions) => {
    if (fs.existsSync(depPath)) return depPath
    for (const extension of extensions) {
        const filePath = depPath + extension
        if (fs.existsSync(filePath)) {
            return filePath
        }
    }

    throw new Error('can\'t not find ' + depPath)
}

const getSource = (chunk) => {
    return `(() => {
        const modules = {${chunk.modules.map(module => {
            return `'${module.id}'(module) {
                ${module.__source}
            }`
        })}}
        const cache = {}
        const require = (id) => {
            const cacheModules = cache[id]
            if(cacheModules) return cacheModules.exports
            const module = cache[id] = {
                exports: {}
            }

            modules[id](module, module.exports, require)
            return module.exports
        }
        
        ${chunk.entryModule.__source}
    })()`
}

