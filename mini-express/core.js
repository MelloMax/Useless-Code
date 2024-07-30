import http from 'node:http'
import {match, pathToRegexp} from 'path-to-regexp'

const miniExpress = () => {
    return new Application()
}

// 基础里面的方法代理给Router示例去处理
class Application {
    constructor() {
        this.router = new Router()
    }

    // 应用层中间件
    use(path, ...fns) {
        this.router.use(path, fns)
    }

    listen(...args) {
        const server = http.createServer(this.handler.bind(this))
        server.listen(...args)
        console.log('服务器启动')
    }

    handler(req, res) {
        this.router.handler(req, res)
    }


    // 路由层中间件
    get(path, ...fns) {
        const route = this.router.route(path)
        route.get(...fns)
    }

}

class Router {
    constructor() {
        // 收集应用中间件 Layer
        this.stack = []
    }

    handler(req, res) {
        const stack = this.stack
        let len = stack.length
        let matchCount = 0

        const next = (index) => {
            if (index < len) {
                const layer = stack[index++]
                const matched = layer.match(req.url)
                if (matched) {
                    matchCount++
                    req.params = matched.params
                    layer.handler(req, res, () => next(index))
                    return
                }
                next(index)
            } else if (!(matchCount > 0)) {
                res.status = 404
                res.end('NOT FOUND PAGES')
            }
        }

        next(0)
    }


    // 应用级中间件
    use(path, fns) {
        fns.forEach(fn => {
            const layer = new Layer(path, fn)
            this.stack.push(layer)
        })
    }


    route(path) {
        const route = new Route(path)
        const layer = new Layer(path, route.dispatch.bind(route), {end: true})
        layer.route = route
        this.stack.push(layer)

        return route
    }


}

// 中间件抽象层
class Layer {
    constructor(path = '', handler, options) {
        this.path = path
        this.handler = handler
        this.re = pathToRegexp(path)
        this.options = options
    }

    match(url) {
        return match(this.path, this.options)(url)
    }
}

class Route {
    constructor(path) {
        this.path = path
        this.stack = []
        this.methods = {}
    }

    // 路由级中间件
    get(...fns) {
        this.methods.get = true
        fns.forEach(fn => {
            const layer = new Layer(this.path, fn)
            this.stack.push(layer)
        })
    }

    dispatch(req, res, done) {
        const stack = this.stack
        let len = stack.length
        const next = (index) => {
            if (index < len) {
                stack[index++].handler(req, res, () => next(index))
                return
            }
            done()
        }
        next(0)
    }
}

export default miniExpress