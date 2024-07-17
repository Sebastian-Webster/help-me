let disconnected = false;
let needingHelp = false;
let role;
let name;
let currentScreen;

try {
    await import('/socket.io/socket.io.js')
    changeScreenContent('welcome-screen')
} catch (error) {
    console.error(error)
    changeScreenContent('error-getting-socket-code')
}

const socket = io()
const protocolVersion = 1;

socket.on('disconnect', () => {
    handleInvalidConnection()
})

socket.on('connect_error', () => {
    handleInvalidConnection()
})

socket.on('connect', () => {
    if (disconnected) {
        disconnected = false
        socket.emit('request protocol version', (response) => {
            if (response !== protocolVersion) {
                handleInvalidProtocolVersion(response)
                return
            }
            
            socket.emit('authenticate', {name, role, needingHelp, reauthenticating: true}, (error) => {
                document.getElementById('disconnected-screen').classList.add('hidden')
                handleAuthentication(error)
            })
        })
    }
})

socket.on('update client state', (state) => {
    handleClientStateChange(state)
})

function changeScreenContent(screen) {
    if (screen !== currentScreen) {
        currentScreen = screen;

        const id = `${screen}-template`
        const main = document.querySelector('main')
        main.innerHTML = ''
        main.appendChild(document.getElementById(id).content.cloneNode(true))
    
        if (screen === 'main-app') {
            if (role === 'trainer') {
                const trainerTopBar = document.getElementById('trainer-top-bar-template').content.cloneNode(true)
                document.getElementById('top-bar').appendChild(trainerTopBar)
            } else if (role === 'student') {
                const studentTopBar = document.getElementById('student-top-bar-template').content.cloneNode(true)
                document.getElementById('top-bar').appendChild(studentTopBar)
            }
        }
    }
}

function handleClientStateChange(state) {
    console.log('Reacting to client state change:', state)
    if (state.protocolVersion !== protocolVersion) return handleInvalidProtocolVersion(state.protocolVersion)
    if (state.meetingStarted) {
        changeScreenContent('main-app')
    } else {
        changeScreenContent('meeting-not-started')
        const secondaryItem = document.getElementById('meeting-not-started-secondary-item')
        if (role === 'student') {
            secondaryItem.textContent = 'Please come back later.'
        } else if (role === 'trainer') {
            secondaryItem.innerHTML = `<button onclick="startMeeting()">Start Meeting</button>`
        }
    }
}

function handleInvalidProtocolVersion(version) {
    document.getElementById('incorrect-protocol-version').classList.remove('hidden')
    document.getElementById('supported-protocol-version').textContent = protocolVersion
    document.getElementById('server-protocol-version').textContent = version
}

function handleInvalidConnection() {
    document.getElementById('disconnected-screen').classList.remove('hidden')
    disconnected = true;
}

function changeRole(newRole) {
    role = newRole;
    changeScreenContent('enter-name')
}

function setName(e) {
    e.preventDefault();
    name = e.target.name.value
    console.log(role, name)
    socket.emit('authenticate', {name, role, needingHelp}, handleAuthentication)
}

function handleAuthentication(error) {
    if (error) {
        console.error(error)
        changeScreenContent('enter-name')
        const errorText = document.getElementById('name-error')
        errorText.classList.remove('hidden')
        errorText.textContent = error
        return
    }

    changeScreenContent('main-app')
}

function startMeeting() {
    socket.emit('start meeting')
}

function endMeeting() {
    socket.emit('end meeting')
}

window.changeRole = changeRole
window.setName = setName
window.startMeeting = startMeeting
window.endMeeting = endMeeting