require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const mongoose = require("mongoose")

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const dbUrl = process.env.DB_URL

const Message = mongoose.model("Message", {
    name: String,
    message: String
})

app.get("/messages", (req, res) => {
    Message.find((err, messages) => {
        res.send(messages)
    })
})

app.get('/messages/:user', (req, res) => {
    const user = req.params.user
    Message.find({name: user}, (err, messages) => {
        res.send(messages)
    })
})

app.post("/messages", async (req, res) => {

    try {
        const message = new Message(req.body)

        const savedMessage = await message.save()

        console.log("saved")
            
        const censored = await Message.findOne({ message: "badword" })
            
        if (censored)
            await Message.deleteOne({_id: censored.id})
        else
            io.emit('message', req.body)

        res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500)
        return console.error(err)
    }
})

io.on("connection", (socket) => {
    console.log("a user connected")
})

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    console.log("mongo db connection", err)
})

const server = http.listen(3000, () => {
    console.log("Server listening on port " + server.address().port)
})