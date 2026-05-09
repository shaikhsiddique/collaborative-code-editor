const express = require("express");
const  {createServer} = require('http')
const {Server} = require("socket.io")
const { YSocketIO } = require("y-socket.io/dist/server")
const cors = require("cors");

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"))

const  io = new Server(httpServer,{
    cors:{
        origin: "*",
        methods : ["GET","POST"]
    }
})
const ySocketIo = new YSocketIO(io);
ySocketIo.initialize()



app.get('/',(req,res)=>{
    res.status(200).json({
        message : "Working",
        success : true
    })
})

app.get("/heath",(req,res)=>{
    res.status(200).json({
         message : "Ok",
        success : true
    })
})


httpServer.listen(3000,()=>{
    console.log("Server Runing")
})