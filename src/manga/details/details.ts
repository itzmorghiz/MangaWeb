import "@global"
import { parseQuery, parseURL } from "ufo"
import { MANGA_STATUS_S, MangaSource, MangaStatus } from "../../scripts/sources/common/manga/base"
import { KaliScanSource } from "../../scripts/sources/en/kaliscan.com/source"
import coverPlaceholder from "/placeholder_small_dark.jpg?url"
import { removeShimmer } from "@global"
import { LANGUAGES_S } from "../../scripts/sources/common/base"

const statusToIcon: Record<MangaStatus, string> = {
    0: "question_mark",
    1: "schedule",
    2: "done_all",
    3: "license",
    4: "pause_circle",
    5: "close"
}

const mSources: Record<string, MangaSource> = {
    kaliscan: new KaliScanSource()
}

const URL = parseURL(location.href)

const queries = parseQuery(URL.search)

const sourceID = queries.source as string
const mangaID = queries.id as string

if (!sourceID || !mangaID) {
    throw new Error("INCORRECT URL: " + URL)
}

const src = mSources[sourceID]

if (!src) {
    throw new Error("SOURCE NOT FOUND: " + sourceID)
}

src.getMangaDetails(mangaID).then(manga => {
    const webButton = document.getElementById("web")!
    webButton.onclick = () => {
        open(manga.url)
    }
    webButton.removeAttribute("disabled")

    const coverDiv = document.getElementById("coverDiv")!
    const cover = document.createElement("img")

    cover.id = "cover"

    if (manga.thumbnail_url) {
        cover.src = manga.thumbnail_url
    } else {
        cover.src = coverPlaceholder
        cover.classList.add("placeholder")
    }

    cover.onload = () => {
        coverDiv.appendChild(cover)
        removeShimmer(coverDiv)
    }

    const titleDiv = document.getElementById("title")!
    const authorsDiv = document.getElementById("authors")!

    titleDiv.innerText = manga.title
    removeShimmer(titleDiv)

    if (manga.authors) {
        authorsDiv.innerText = manga.authors.join(", ")
        removeShimmer(authorsDiv)
    } else {
        authorsDiv.remove()
    }

    const descDiv = document.getElementById("descDiv")!

    if (manga.description) {
        descDiv.innerText = manga.description
        removeShimmer(descDiv)
    } else {
        descDiv.remove()
    }

    const sourceDiv = document.getElementById("source")!
    sourceDiv.innerText = `${src.name} (${LANGUAGES_S[src.lang].toLowerCase()})`
    removeShimmer(sourceDiv.parentElement!)

    const status = manga.status
    const statusDiv = document.getElementById("status")!
    statusDiv.innerHTML = `<span icon>${statusToIcon[status]}</span>${MANGA_STATUS_S[status]}`
    removeShimmer(statusDiv.parentElement!)
})

src.getChapters(mangaID).then(chapterList => {
    const chapterListDiv = document.getElementById("chapterList")!
    chapterListDiv.innerHTML = ""

    chapterList.forEach(chap => {
        chapterListDiv.innerHTML += `
        <a href= "/manga/read/?source=${sourceID}&id=${mangaID}&chap=${chap.id}">
            <div class="chapterEntry" horizontal>
                <div class="name">${chap.name}</div>
            </div>
        </a>
        `
    })
})