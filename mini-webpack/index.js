import {miniWebpack} from "./core.js";
import config from './config.js'

const compiler =  miniWebpack(config)
compiler.run(() => {})