const http = require('http')
const {Server} = require('socket.io');
const server = http.createServer()
const io = new Server(server)

const serverState = {
    meetingStarted: false,
    protocolVersion: 1,
    connections: {},
    helpQueue: []
}

io.on('connection', socket => {
    serverState.connections[socket.id] = {socket}

    socket.on('disconnect', () => {
        delete serverState.connections[socket.id]
        serverState.helpQueue = serverState.helpQueue.filter()
    })

    socket.on('entered name and role', (userData => {
        const nameIndex = Object.values(serverState.connections).findIndex(user => user.name === userData.name)

        if (nameIndex !== -1) {
            socket.emit('name error')
            return
        }

        serverState.connections[socket.id] = {
            ...serverState.connections[socket.id],
            ...userData
        }

        socket.emit('auth success', userData)
    }))

    socket.on('need help', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'student') {
            serverState.helpQueue.push(user.name)
        }
    })

    socket.on('no longer need help', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'student') {
            serverState.helpQueue.filter(student => student.name !== user.name)
        }
    })

    socket.on('start break', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'trainer') {
            user.break = true;
        }
    })

    socket.on('end break', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'trainer') {
            user.break = false;
        }
    })
})

server.listen(3000, () => {
    console.log('Listening on port 3000')
})