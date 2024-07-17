try {
    await import('/socket.io/socket.io.js')
    changeScreenContent('welcome-screen')
} catch (error) {
    console.error(error)
    changeScreenContent('error-getting-socket-code')
}

const socket = io()
const protocolVersion = 1;

socket.on('name error', () => {
    document.getElementById('name-error').classList.remove('hidden')
})

socket.on('update client state', (state) => {
    handleClientStateChange(state)
})

let role;
let name;

function changeScreenContent(screen) {
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

}

function changeRole(newRole) {
    role = newRole;
    changeScreenContent('enter-name')
}

function setName(e) {
    e.preventDefault();
    name = e.target.name.value
    console.log(role, name)
    socket.emit('entered name and role', {name, role})
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