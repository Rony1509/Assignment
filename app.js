const API = 'http://localhost:3000'

// Helpers
const qs = s => document.querySelector(s)
const qsa = s => Array.from(document.querySelectorAll(s))

async function apiGet(path) {
    const res = await fetch(API + path)
    if (!res.ok) throw new Error('Network error')
    return res.json()
}
async function apiPost(path, body) {
    const res = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Network error')
    return res.json()
}
async function apiPatch(path, body) {
    const res = await fetch(API + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Network error')
    return res.json()
}
async function apiDelete(path) {
    const res = await fetch(API + path, { method: 'DELETE' })
    if (!res.ok) throw new Error('Network error')
    return res
}

function getLoggedIn() {
    try { return JSON.parse(localStorage.getItem('loggedIn')) } catch (e) { return null }
}

function setLoggedIn(user) {
    localStorage.setItem('loggedIn', JSON.stringify(user))
}

function logout() {
    localStorage.removeItem('loggedIn')
    navigate('#login')
}

function navigate(hash) {
    location.hash = hash
}

// Routing
async function router() {
    const hash = location.hash || '#login'
    const main = qs('#app')
    showUserArea()

    if (hash.startsWith('#login')) return renderLogin(main)
    if (hash.startsWith('#news') && /^#news$/.test(hash)) return renderNewsList(main)
    if (hash.startsWith('#create')) return renderCreate(main)
    if (hash.startsWith('#detail')) {
        const id = hash.split('/')[1]
        return renderDetail(main, id)
    }
    if (hash.startsWith('#edit')) {
        const id = hash.split('/')[1]
        return renderEdit(main, id)
    }
    // default
    renderNewsList(main)
}

// UI pieces
async function renderLogin(container) {
    container.innerHTML = '<h2>Login</h2>'
    const users = await apiGet('/users')
    const sel = document.createElement('select')
    sel.innerHTML = '<option value="">-- Select user --</option>' + users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')
    const btn = document.createElement('button')
    btn.className = 'btn'
    btn.textContent = 'Login'
    btn.onclick = () => {
        const uid = Number(sel.value)
        if (!uid) return alert('Select a user')
        const user = users.find(u => u.id === uid)
        setLoggedIn(user)
        navigate('#news')
    }
    container.appendChild(sel)
    container.appendChild(document.createElement('br'))
    container.appendChild(document.createElement('br'))
    container.appendChild(btn)
}

async function renderNewsList(container) {
    const loggedIn = getLoggedIn()
    const allNews = await apiGet('/news')
    const users = await apiGet('/users')
    const usersById = Object.fromEntries(users.map(u => [u.id, u]))

    container.innerHTML = ''
    const top = document.createElement('div')
    top.className = 'controls'
    const search = document.createElement('input')
    search.placeholder = 'Search by title...'
    search.className = 'search'
    const createBtn = document.createElement('button')
    createBtn.className = 'btn'
    createBtn.textContent = 'Create News'
    createBtn.onclick = () => {
        if (!loggedIn) { alert('Please login first');
            navigate('#login'); return }
        navigate('#create')
    }
    top.appendChild(search)
    top.appendChild(createBtn)
    container.appendChild(top)

    const list = document.createElement('div')

    function buildList(filter = '') {
        list.innerHTML = ''
        const filtered = allNews.filter(n => n.title.toLowerCase().includes(filter.toLowerCase()))
        filtered.forEach(n => {
            const div = document.createElement('div')
            div.className = 'list-item'
            div.innerHTML = `<div class="title">${escapeHtml(n.title)}</div>
        <div class="meta">by ${escapeHtml(usersById[n.author_id]?.name||'Unknown')} • <span class="small">${n.comments?.length||0} comments</span></div>`

            const btns = document.createElement('div')
            btns.style.marginTop = '8px'
            const view = document.createElement('button')
            view.className = 'link'
            view.textContent = 'View Details'
            view.onclick = () => navigate(`#detail/${n.id}`)
            btns.appendChild(view)

            if (loggedIn && loggedIn.id === n.author_id) {
                const edit = document.createElement('button')
                edit.className = 'link'
                edit.textContent = 'Edit'
                edit.onclick = () => navigate(`#edit/${n.id}`)
                const del = document.createElement('button')
                del.className = 'link'
                del.textContent = 'Delete'
                del.onclick = async() => {
                    if (!confirm('Delete this news item?')) return
                    await apiDelete(`/news/${n.id}`)
                        // refresh local list
                    const idx = allNews.findIndex(x => x.id === n.id)
                    if (idx > -1) allNews.splice(idx, 1)
                    buildList(search.value)
                }
                btns.appendChild(document.createTextNode(' | '))
                btns.appendChild(edit)
                btns.appendChild(document.createTextNode(' '))
                btns.appendChild(del)
            }

            div.appendChild(btns)
            list.appendChild(div)
        })
    }

    search.addEventListener('input', e => buildList(e.target.value))
    buildList('')
    container.appendChild(list)
}

async function renderCreate(container) {
    const loggedIn = getLoggedIn()
    if (!loggedIn) { alert('Please login');
        navigate('#login'); return }
    container.innerHTML = '<h2>Create News</h2>'
    const form = document.createElement('form')
    form.innerHTML = `<label>Title</label><input name="title" type="text" />
    <label>Body</label><textarea name="body"></textarea>
    <div class="actions"><button class="btn" type="submit">Create</button>
    <button class="btn ghost" type="button" id="cancel">Cancel</button></div>
    <div id="err" class="error"></div>`
    form.querySelector('#cancel').onclick = () => navigate('#news')
    form.onsubmit = async(e) => {
        e.preventDefault()
        const title = form.title.value.trim()
        const body = form.body.value.trim()
        const err = qs('#err')
        err.textContent = ''
        if (!title) { err.textContent = 'Title cannot be empty'; return }
        if (body.length < 20) { err.textContent = 'Body must be at least 20 characters'; return }
        const payload = { title, body, author_id: loggedIn.id, comments: [] }
        await apiPost('/news', payload)
        navigate('#news')
    }
    container.appendChild(form)
}

async function renderDetail(container, id) {
    const news = await apiGet(`/news/${id}`)
    const users = await apiGet('/users')
    const usersById = Object.fromEntries(users.map(u => [u.id, u]))
    const loggedIn = getLoggedIn()
    container.innerHTML = `<h2>${escapeHtml(news.title)}</h2>
    <div class="meta">by ${escapeHtml(usersById[news.author_id]?.name||'Unknown')}</div>
    <p>${escapeHtml(news.body)}</p>
    <h3>Comments (${news.comments?.length||0})</h3>
    <div id="comments"></div>
    <h4>Add Comment</h4>
    <div id="comment-area"></div>
    <div style="margin-top:12px"><button class="btn" id="back">Back</button></div>`

    qs('#back').onclick = () => navigate('#news')

    const commentsDiv = qs('#comments')
        (news.comments || []).forEach(c => {
            const d = document.createElement('div')
            d.className = 'comment'
            d.innerHTML = `<div class="small"><strong>${escapeHtml(usersById[c.user_id]?.name||'User')}</strong></div>
      <div>${escapeHtml(c.text)}</div>`
            commentsDiv.appendChild(d)
        })

    const commentArea = qs('#comment-area')
    if (!loggedIn) {
        commentArea.innerHTML = '<div class="small">Please login to comment.</div>'
        return
    }
    const ta = document.createElement('textarea')
    ta.placeholder = 'Write your comment here'
    const addBtn = document.createElement('button')
    addBtn.className = 'btn'
    addBtn.textContent = 'Add Comment'
    const err = document.createElement('div')
    err.className = 'error'
    commentArea.appendChild(ta)
    commentArea.appendChild(addBtn)
    commentArea.appendChild(err)

    addBtn.onclick = async() => {
        const text = ta.value.trim()
        err.textContent = ''
        if (!text) { err.textContent = 'Comment cannot be empty'; return }
        const newComment = { id: Date.now(), user_id: loggedIn.id, text }
        const updated = (news.comments || []).concat(newComment)
        await apiPatch(`/news/${id}`, { comments: updated })
        navigate(`#detail/${id}`)
    }
}

async function renderEdit(container, id) {
    const loggedIn = getLoggedIn()
    if (!loggedIn) { alert('Please login');
        navigate('#login'); return }
    const news = await apiGet(`/news/${id}`)
    if (news.author_id !== loggedIn.id) { alert('Not allowed');
        navigate('#news'); return }
    container.innerHTML = '<h2>Edit News</h2>'
    const form = document.createElement('form')
    form.innerHTML = `<label>Title</label><input name="title" type="text" />
    <label>Body</label><textarea name="body"></textarea>
    <div class="actions"><button class="btn" type="submit">Save</button>
    <button class="btn ghost" type="button" id="cancel">Cancel</button></div>
    <div id="err" class="error"></div>`
    form.title.value = news.title
    form.body.value = news.body
    form.querySelector('#cancel').onclick = () => navigate('#news')
    form.onsubmit = async(e) => {
        e.preventDefault()
        const title = form.title.value.trim()
        const body = form.body.value.trim()
        const err = qs('#err')
        err.textContent = ''
        if (!title) { err.textContent = 'Title cannot be empty'; return }
        if (body.length < 20) { err.textContent = 'Body must be at least 20 characters'; return }
        await apiPatch(`/news/${id}`, { title, body })
        navigate('#news')
    }
    container.appendChild(form)
}

function showUserArea() {
    const ua = qs('#user-area')
    const user = getLoggedIn()
    if (user) {
        ua.innerHTML = `Logged in as: <strong>${escapeHtml(user.name)}</strong> <button class="btn ghost" id="logout">Logout</button>`
        qs('#logout').onclick = logout
    } else {
        ua.innerHTML = `<a href="#login" class="link">Login</a>`
    }
}

function escapeHtml(s) {
    if (!s) return ''
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)