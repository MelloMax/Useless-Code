# 参考资料

- [如何实现一个最小版 express](https://github.com/shfshanyue/mini-code/tree/master/code/express)

中间件伪结构

```javascript
const app = {
    stack: [
        Layer({
            path: '/api',
            handler: 'A 的中间件处理函数'
        }),
        Layer({
            path: '/api',
            handler: 'B 的中间件处理函数'
        }),
        Layer({
            path: '/api',
            handler: 'Route.dispatch: 用以执行该中间件下的所有路由级中间件',
            // 对于 app.get 注册的中间件 (应用级路由中间件)，将会带有 route 属性，用以存储该中间件的所有路由级别中间件
            route: Route({
                path: '/api',
                stack: [
                    Layer({
                        path: '/',
                        handler: 'C 的中间件处理函数'
                    }),
                    Layer({
                        path: '/',
                        handler: 'D 的中间件处理函数'
                    })
                ]
            })
        })
    ]
}
 ```

每次调用`use`都会创建Layer示例

每次调用`get`会创建Route实例在创建Layer实例去绑定Route的`dispatch`函数
