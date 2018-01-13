const io = require("socket.io")()
const shortid = require("shortid")

const modules = {}

function mobileSocket(socket) {
  console.log("<- mobile")
  socket.join("mobiles")

  Object.keys(modules).forEach(id => {
    socket.emit("module", {id, type: modules[id].type})
  })

  socket.on("dispatch", data => {
    modules[data.id].socket.emit(data.action, data.payload)
  })
}

function moduleSocket(module) {
  const {socket, id} = module
  socket.on("dispatch", data => {
    console.log(`<- dispatch: ${JSON.stringify({...data, id})}`)
    io.to("mobiles").emit("dispatch", {
      ...data,
      id,
    })
  })

  socket.on("disconnect", () => {
    io.to("mobiles").emit("leave", id)
  })
}

io.on("connection", socket => {
  console.log("<- connection")
  socket.on("type", type => {
    if (type === "MOBILE") mobileSocket(socket)
    else {
      const id = shortid.generate()
      const module = {
        id,
        socket,
        type,
      }

      console.log(`<- type: {id: ${id}, type: ${type}}`)

      modules[id] = module
      io.to("mobiles").emit("module", {id, type})

      moduleSocket(module)
    }
  })
})

io.listen(process.env.PORT || 3000)
