const baseUrl = 'https://v1.slashapi.com/<your-team>/dropbox/<identifier>';
const table = document.getElementById('items')
var currentPath = ''

var form = document.getElementById('upload-form')
form.addEventListener('submit', (e) => {
    e.preventDefault()

    var formData = new FormData();
    var imagefile = document.querySelector('#file');
    formData.append('file', imagefile.files[0]);
    formData.append('directory', currentPath)
    axios.post(baseUrl, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then((response) => {
        // Refresh items
        listContents(currentPath)
    })
})

function appendRow(data) {
    data.forEach(function (item) {
        var row = table.insertRow(),
            basename = row.insertCell(0),
            size = row.insertCell(1),
            action = row.insertCell(2),
            link = document.createElement('a'),
            actionButton = document.createElement('button')

        link.href = '#';

        // Download file directly from the API
        if (item.type == 'file') {
            link.href = baseUrl + '/download?path=' + item.path
        }

        link.innerHTML = (item.basename)
        link.setAttribute('data-type', item.type)
        link.setAttribute('class', 'item-link')
        link.setAttribute('data-path', item.path)

        basename.appendChild(link)

        actionButton.setAttribute('data-type', item.type)
        actionButton.setAttribute('data-path', item.path)
        actionButton.classList.add(...['btn', 'btn-danger', 'btn-sm', 'btn-delete'])
        actionButton.innerHTML = 'Delete'

        action.appendChild(actionButton)

        if (item.size) {
            size.innerHTML = filesize(item.size)
        }
        else {
            size.innerHTML = '-'
        }
    })
}

function appendBreadcrumb(breadcumbs, item)
{
    var newLI = document.createElement('li');
    if (item.link) {
        newLI.classList.add(...['breadcrumb-item'])
        var link = document.createElement('a')
        link.innerHTML = item.title
        link.href = '#'
        if (item.path !== undefined) {
            link.setAttribute('data-path', item.path)
        }
        link.setAttribute('data-type', 'dir')
        link.classList.add('item-link')
        newLI.appendChild(link)
    } else {
        newLI.classList.add(...['breadcrumb-item', 'active'])
        newLI.appendChild(document.createTextNode(item.title))
    }

    breadcumbs.appendChild(newLI)
}

function buildBreadcrumbs(items)
{
    var taskList = document.getElementById('breadcrumb')

    var children = Array.prototype.slice.call(taskList.childNodes);

    // Remove each child node
    children.forEach(function (child) {
        taskList.removeChild(child);
    });

    if (items) {
        appendBreadcrumb(taskList, {
            title: 'Home',
            link: "#",
            path: ''
        })

        var last = items.pop()
        items.forEach(function (item) {
            appendBreadcrumb(taskList, {
                title: item.title,
                link: '#',
                path: item.path
            })
        })

        appendBreadcrumb(taskList, {
            title: last.title
        })
    } else {
        appendBreadcrumb(taskList, {
            title: 'Home'
        })
    }
}

document.addEventListener('click',function (e) {
    if (e.target && e.target.classList.contains('item-link')) {
        if (e.target.getAttribute('data-type') == 'dir') {
            listContents(e.target.getAttribute('data-path'))
            var breadcrumbItems = e.target.getAttribute('data-path').split('/')

            var breadcrumbs = [],
                path = []

            breadcrumbItems.forEach(item => {
                path.push(item)
                breadcrumbs.push({
                    title: item,
                    path: path.join('/')
                })
            })

            currentPath = e.target.getAttribute('data-path')

            buildBreadcrumbs(breadcrumbs)
        }
    }

    // Delete
    if (e.target && e.target.classList.contains('btn-delete')) {
        if (confirm('Are you sure you want to delete this item?')) {
            var type = 'files',
                target = [e.target.getAttribute('data-path')]

            if (e.target.getAttribute('data-type') == 'dir') {
                type = 'directory'
                target = e.target.getAttribute('data-path')
            }

            var params = {}
            params[type] = target

            axios.delete(baseUrl, { data: params })
                .then(response => {
                    e.target.closest('tr').remove()
                })
        }
    }
});

function listContents(path) {
    while(table.rows[0]) table.deleteRow(0);

    var options = {
        params: {
            directory: path
        }
    }

    var directories = axios.get(baseUrl + '/directories', options),
        files = axios.get(baseUrl + '/files', options)

    axios.all([directories, files])
        .then(
            axios.spread((firstResponse, secondResponse) => {
                appendRow(firstResponse.data)
                appendRow(secondResponse.data)
            })
        )
        .catch(error => console.log(error));
}

listContents()
buildBreadcrumbs()
