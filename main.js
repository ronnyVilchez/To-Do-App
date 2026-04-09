const inputTasks = document.querySelector('.addTasks')
const lista = document.querySelector('.lista')
const form = document.querySelector('.form')

const todos = document.getElementById('todos')
const activas = document.getElementById('activas')
const completas = document.getElementById('completas')

const button = document.querySelector('#button')
const add = document.querySelector('.add')

document.getElementById('darkMode').addEventListener('click', () => {
    document.body.classList.toggle('dark')
})

let activo = ''

/* add.style.display = 'inline'
button.style.display = 'none' */

// 🔥 CONFIG AIRTABLE
const API_KEY = "patV3rP6vWhwrTrKV.ebef62945ed938e62a55a4d99b6c4a0010877a73d4b580d73ff60dd26c96babb"
const API_URL = "https://api.airtable.com/v0/appwCeb98XgcaJaZr/Table%201"


// 🔹 GET
async function getTasks() {
    const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${API_KEY}` }
    })
    const data = await res.json()

    return data.records
        .map(r => ({
            id: r.id,
            title: r.fields.title,
            completed: r.fields.completed || false,
            fecha: r.fields.fecha
        }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

// 🔹 CREATE
async function createTask(title) {
    await fetch(API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fields: { title, completed: false }
        })
    })
}

// 🔹 UPDATE
async function updateTask(id, completed) {
    await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fields: { completed }
        })
    })
}

// 🔹 DELETE
async function deleteTask(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${API_KEY}`
        }
    })
}

// 🔥 CARGA INICIAL
async function init() {
    const tareas = await getTasks()
    allTasks(tareas, lista)
}
init()

// 🔹 ADD TASK
form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (inputTasks.value !== '') {
        await createTask(inputTasks.value)
        const tareas = await getTasks()
        fSwitch(tareas, lista)
        form.reset()
    }
})

// 🔹 CHECKBOX
lista.addEventListener('change', async (e) => {
    if (e.target.tagName === 'INPUT') {
        box(e.target)
        style(e.target, e.target.nextElementSibling)

        await updateTask(e.target.id, e.target.checked)

        const tareas = await getTasks()
        fSwitch(tareas, lista)
    }
})

// 🔹 FILTROS
todos.addEventListener('click', async (e) => {
    e.preventDefault()
    activo = 'all'
    const tareas = await getTasks()
    allTasks(tareas, lista)
})

completas.addEventListener('click', async () => {
    const tareas = await getTasks()
    filtercompleted(tareas, lista)
    lista.addEventListener('click', (event) => trash(event, lista))
})

activas.addEventListener('click', async () => {
    activo = 'act'
    const tareas = await getTasks()
    filterUncompleted(tareas, lista)
})

// 🔹 DELETE COMPLETED
button.addEventListener('click', async () => {
    const tareas = await getTasks()
    for (let t of tareas) {
        if (t.completed) {
            await deleteTask(t.id)
        }
    }
    const nuevas = await getTasks()
    filtercompleted(nuevas, lista)
})

// 🔧 FUNCIONES ORIGINALES (NO CAMBIADAS)
function fSwitch(local, lista) {
    switch (activo) {
        case 'act':
            filterUncompleted(local, lista)
            break;
        case 'all':
            allTasks(local, lista)
            break;
        case 'comp':
            filtercompleted(local, lista)
            break;
        default:
            allTasks(local, lista)
            break;
    }
}

function showDOM(id, title, completed, lista, clas, fecha) {

    let fechaFormateada = ''

    if (fecha) {
        const [year, month, day] = fecha.split('-')

        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ]

        fechaFormateada = `${day} ${meses[month - 1]}`
    }

    const new_task = ` 
    <li style="display:flex; justify-content:space-between; align-items:center;">
        
        <div style="display:flex; align-items:center; gap:10px;">
            <input class='checkbox' type="checkbox" ${completed ? 'checked' : ''} id="${id}" >
            <label style="text-decoration:${completed ? 'line-through' : 'none'}" for="${id}">
                ${title}
            </label>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
            <small>${fechaFormateada}</small>
            <i class="${clas}"></i>
        </div>

    </li> `

    lista.innerHTML += new_task
}
function style(input, label) {
    if (input.checked === true) {
        label.setAttribute('style', 'text-decoration: line-through ')
    } else {
        label.setAttribute('style', 'text-decoration: none ')
    }
}

function box(input) {
    if (input.checked === true) {
        input.setAttribute('checked', 'checked')
    } else {
        input.removeAttribute('checked')
    }
}

function allTasks(array, lista) {
    setActiveTab(todos)
    toggleDeleteButton(false)

    lista.innerHTML = ''
    array.forEach(e => {
        showDOM(e.id, e.title, e.completed, lista, 'none', e.fecha)
    })
}

function trash(e, lista) {
    if (e.target.tagName === 'I') {
        const li = e.target.closest('li')
        const idInput = li.querySelector('input').id
        delet(idInput, lista)
    }
}

async function filtercompleted(array, lista) {
    setActiveTab(completas)
    toggleDeleteButton(true)

    activo = 'comp'

    lista.innerHTML = ''
    let styleIcon = 'fa-solid fa-trash'

    array.forEach(e => {
        if (e.completed === true) {
            showDOM(e.id, e.title, e.completed, lista, styleIcon, e.fecha)
        }
    })
}

function filterUncompleted(array, lista) {
    setActiveTab(activas)
    toggleDeleteButton(false)

    lista.innerHTML = ''
    array.forEach(e => {
        if (e.completed === false) {
            showDOM(e.id, e.title, e.completed, lista, 'none', e.fecha)
        }
    })
}

async function delet(id, lista) {
    await deleteTask(id)
    const tareas = await getTasks()
    filtercompleted(tareas, lista)
}

function toggleDeleteButton(show) {
    if (show) {
        button.style.display = 'block'
    } else {
        button.style.display = 'none'
    }
}

function setActiveTab(tab) {
    todos.classList.remove('active')
    activas.classList.remove('active')
    completas.classList.remove('active')

    tab.classList.add('active')
}

// 🌙 DARK MODE BIEN HECHO

const toggle = document.getElementById('darkMode')

// 1. aplicar preferencia guardada
const savedTheme = localStorage.getItem('theme')

if (savedTheme) {
  document.body.classList.toggle('dark', savedTheme === 'dark')
} else {
  // 2. si no hay preferencia → usar sistema
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark')
  }
}

// 3. toggle manual (SIEMPRE manda el usuario)
toggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark')

  // guardar decisión del usuario
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
})

/* ______________________________________________________
 */
function updateIcon() {
    toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙'
  }
  
  updateIcon()
  
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    updateIcon()
  })