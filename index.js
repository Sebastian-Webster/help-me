const http = require('http')
const express = require('express')
const app = express();
const {Server} = require('socket.io');
const server = http.createServer(app)
const io = new Server(server)

const serverState = {
    meetingStarted: false,
    protocolVersion: 1,
    connections: {},
    helpQueue: []
}

function getClientState() {
    const {connections, ...clientState} = serverState;
    const trainers = Object.values(connections).filter(con => con.role === 'trainer').map(trainer => {
        const clone = {...trainer}
        delete clone.socket
        return clone
    })
    clientState.trainers = trainers;
    console.log('Client State:', clientState)
    return clientState
}

function sendAllClientsUpdatedState() {
    const registeredClients = Object.values(serverState.connections).filter(con => con.role && con.name).map(con => con.socket)
    const state = getClientState();
    for (const sock of registeredClients) {
        sock.emit('update client state', state)
    }
}

io.on('connection', socket => {
    console.log('Somebody connected to the socket')
    serverState.connections[socket.id] = {socket}

    socket.on('disconnect', () => {
        const name = serverState.connections[socket.id].name
        delete serverState.connections[socket.id]
        serverState.helpQueue = serverState.helpQueue.filter(item => item === name)
        console.log(`${name || 'A user that has not set their name yet'} disconnected`)
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

        sendAllClientsUpdatedState()
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
            serverState.helpQueue.filter(student => student !== user.name)
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

    socket.on('start meeting', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'trainer') {
            serverState.meetingStarted = true;
            console.log(`${user.name} started the meeting`)
            sendAllClientsUpdatedState()
        }
    })

    socket.on('end meeting', () => {
        const user = serverState.connections[socket.id]
        if (user.role === 'trainer') {
            serverState.meetingStarted = false;
            serverState.helpQueue = [];
            console.log(`${user.name} ended the meeting`)
            sendAllClientsUpdatedState()
        }
    })

    socket.on('request protocol version', (callback) => {
        callback(serverState.protocolVersion)
    })
})

app.use(express.static('public'))

server.listen(3000, () => {
    console.log('Listening on port 3000')
})