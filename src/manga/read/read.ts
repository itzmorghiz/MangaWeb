import "@global"
import { MangaSource } from "../../scripts/sources/common/manga/base"
import { KaliScanSource } from "../../scripts/sources/en/kaliscan.com/source"
import { parseQuery, parseURL } from "ufo"

const mSources: Record<string, MangaSource> = {
    kaliscan: new KaliScanSource()
}

const URL = parseURL(location.href)

const queries = parseQuery(URL.search)

const sourceID = queries.source as string
const mangaID = queries.id as string
const chapID = queries.chap as string

if (!sourceID || !mangaID || !chapID) {
    throw new Error("INCORRECT URL: " + URL)
}

const src = mSources[sourceID]

if (!src) {
    throw new Error("SOURCE NOT FOUND: " + sourceID)
}

src.getChapterData(mangaID, chapID).then((chap) => {
    if (chap.prev_id) {
        const prevElem = document.createElement("a")
        prevElem.href = `/manga/read/?source=${sourceID}&id=${mangaID}&chap=${chap.prev_id}`
        prevElem.innerText = "PREVIOUS CHAPTER"
        prevElem.id = "prevChapBtn"

        document.body.appendChild(prevElem)
    }

    chap.images.forEach(url => {
        const imgDiv = document.createElement("div")
        imgDiv.classList.add("chapterImageDiv", "loading")
        imgDiv.setAttribute("shimmer", "")

        const img = document.createElement("img")
        //img.crossOrigin = "anonymous"
        img.src = url
        img.classList.add("chapterImage")
        img.decode().then(() => {
            imgDiv.classList.remove("loading")
            imgDiv.removeAttribute("shimmer")
        })

        imgDiv.appendChild(img)
        document.body.appendChild(imgDiv)
    })


    if (chap.next_id) {
        const nextElem = document.createElement("a")
        nextElem.href = `/manga/read/?source=${sourceID}&id=${mangaID}&chap=${chap.next_id}`
        nextElem.innerText = "NEXT CHAPTER"
        nextElem.id = "nextChapBtn"

        document.body.appendChild(nextElem)
    }
})