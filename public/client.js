try {
    await import('/socket.io/socket.io.js')
    changeScreenContent('welcome-screen')
} catch (error) {
    console.error(error)
    changeScreenContent('error-getting-socket-code')
    return
}

const socket = io()

let role;
let name;

function changeScreenContent(screen) {
    const id = `${screen}-template`
    const main = document.querySelector('main')
    main.innerHTML = ''
    main.appendChild(document.getElementById(id).content.cloneNode(true))
}

function changeRole(newRole) {
    role = newRole;
    changeScreenContent('enter-name')
}

function setName(e) {
    e.preventDefault();
    name = e.target.name.value
    console.log(role, name)
}

window.changeRole = changeRole
window.setName = setName