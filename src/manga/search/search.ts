import "@global"
import { parseQuery, parseURL } from "ufo"
import { MangaSource } from "../../scripts/sources/common/manga/base"
import { KaliScanSource } from "../../scripts/sources/en/kaliscan.com/source"
import coverPlaceholder from "/placeholder_small_dark.jpg?url"

const searchInput = document.getElementById("searchManga")! as HTMLInputElement
const searchBtn = document.getElementById("searchBtn")! as HTMLButtonElement

searchInput.onsubmit = () => {
    location.href = "/manga/search/?q=" + encodeURI(searchInput.value)
}

searchBtn.addEventListener("click", () => {
    location.href = "/manga/search/?q=" + encodeURI(searchInput.value)
})

const url = parseURL(location.href)

const queries = parseQuery(url.search)

const results = document.getElementById("results")!

if (!queries.q) {
    throw new Error("INVALID URL")
}

const searchQuery = queries.q as string

const mSources: Record<string, MangaSource> = {
    kaliscan: new KaliScanSource()
}

Object.keys(mSources).forEach(srcID => {
    const source = mSources[srcID]

    const resColElem = document.createElement("div")
    resColElem.classList.add("mangaResultSource")
    resColElem.setAttribute("vertical", "")

    results.appendChild(resColElem)

    source.searchMangas(searchQuery, 1).then((mangas) => {
        mangas.forEach(manga => {
            resColElem.innerHTML += `
                <div class="mangaResultEntry" horizontal>
                    
            <a href="/manga/details/?source=${srcID}&id=${manga.id}"><div class="cover"><img src="${manga.thumbnail_url || coverPlaceholder}"></div>
            </a>
                    
            <a href="/manga/details/?source=${srcID}&id=${manga.id}"><div class="title">${manga.title}</div>
            </a>
                </div>
            `
        })
    })
});