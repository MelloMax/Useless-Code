import miniExpress from "./core.js";

const app = miniExpress()

app.use('/', (req, res, next) => {
    console.log('app', 1)
    next()
    console.log('app', 6)
    res.end('welcome at home!')
}, (req, res, next) => {
    console.log('app', 2)
    next()
    console.log('app', 5)
}, (req, res, next) => {
    console.log('app', 3)
    next()
    console.log('app', 4)
},)

app.get('/', (req, res, next) => {
    console.log('route', 1)
    next()
    console.log('route', 5)
}, (req, res, next) => {
    console.log('route', 2)
    next()
    console.log('route', 4)
})

app.get('/', (req, res, next) => {
    console.log('route', 3)
    next()
})

app.use('/', (req, res, next) => {
    console.log('app', 7)
    next()
}, () => {
    console.log('app', 8)
})

// 测试正则匹配路径
app.get('/user/:id', (req, res) => {
    console.log('params', req.params)
    res.end('work it! we get your user id is: ' + req.params.id)
})


app.listen(8080)