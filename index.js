const DOMAIN_NAME = "http://localhost:3000/" // where classy is running
const API_ROOT = DOMAIN_NAME + "get/"

const GITHUB_ORIGIN = "https://pjt727.github.io"
const WINDOW_NAME = window.location.origin == GITHUB_ORIGIN ? `${GITHUB_ORIGIN}/classy-api` : window.location.origin
const ROUTE_LINK = `${windowName}?route=`
document.addEventListener("DOMContentLoaded", async () => {
    const searchParams = new URLSearchParams(window.location.search);
    let routeValue = searchParams.get("route")
    routeValue = routeValue === null ? "" : routeValue
    const domainName = document.getElementById("domain-name")

    domainName.innerText = API_ROOT
    const route = document.getElementById("route")
    route.value = routeValue

    // add bread crumbs
    let breadCrumbElement = document.getElementById("breadcrumbs")
    let currentBreadcrumbHref = ROUTE_LINK
    let breadcrumbLink = document.createElement("a")
    breadcrumbLink.href = currentBreadcrumbHref
    breadcrumbLink.innerText = "/"
    breadCrumbElement.appendChild(breadcrumbLink)

    let routeParts = (routeValue + "/").split("/");
    for (let i = 0; i < routeParts.length - 1; i++) {
        let routePart = routeParts[i];
        let sep = document.createElement("span")
        sep.innerText = ">"
        sep.style.display = "inline"
        breadCrumbElement.appendChild(sep)
        currentBreadcrumbHref += routePart
        let breadcrumbLink = document.createElement("a")
        breadcrumbLink.href = currentBreadcrumbHref
        breadcrumbLink.innerText = routePart
        breadCrumbElement.appendChild(breadcrumbLink)
        currentBreadcrumbHref += "/"
    }


    // remove the API ROOT prefix when inserting into the text box
    route.addEventListener("input", () => {
        if (route.value.startsWith(API_ROOT)) {
            let text = route.value
            route.value = text.slice(API_ROOT.length)
        }
    })

    // reload the page listener
    const changeWindow = () => window.location.href = `${WINDOW_NAME}/?route=${route.value}`
    route.addEventListener("keypress", (event) => {
        if (event.key === 'Enter') {
            changeWindow()
        }
    })


    route.focus()
    // get the data from the api
    const out = document.getElementById('output')
    try {
        const response = await fetch(API_ROOT + routeValue)
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json()
        inject_links(routeValue, data)

        const updateData = () => {
            const divWidth = out.offsetWidth;
            const fontSize = window.getComputedStyle(out).fontSize;
            const averageCharWidth = 0.622 * parseFloat(fontSize);
            const charactersPerLine = Math.floor(divWidth / averageCharWidth);
            const options = {
                maxLines: charactersPerLine,
            }
            out.innerHTML = prettyPrintJson.toHtml(data, options)
        }
        updateData()
        window.addEventListener('resize', debounce(updateData, 100));
    } catch (error) {
        out.innerHTML = `Failed to get api data ${error}`
        console.error(error);
    }
})

function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// TODO: add more injection links
function inject_links(route, json_data) {
    if (/^[a-zA-Z0-9]+\/courses$/.test(route)) {
        json_data.forEach((course) => {
            const newRoute = `${route}/${course.subject_code}/${course.number}`
            course._course_link = `${WINDOW_NAME}?route=${newRoute}`
        })
    } else if (/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/classes$/.test(route)) {
        const match = /^([a-zA-Z0-9]+)\/[a-zA-Z0-9]+\/classes/.exec(route);
        json_data.forEach((classEntry) => {
            const newRoute = `${match[1]}/courses/${classEntry.section.subject_code}/${classEntry.section.course_number}`
            classEntry.section._course_link = `${WINDOW_NAME}?route=${newRoute}`
        })
    } else if (/^[a-zA-Z0-9]+$/.test(route)) {
        json_data.forEach((term) => {
            const newRoute = `${route}/${term.id}/classes`
            term._term_link = `${WINDOW_NAME}?route=${newRoute}`
        })
    } else if (route === "") {
        json_data.forEach((school) => {
            school._school_link = `${WINDOW_NAME}?route=${school.id}`
        })
    }
    return json_data
}
