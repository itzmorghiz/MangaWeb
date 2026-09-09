import "@global"

const searchInput = document.getElementById("searchManga")! as HTMLInputElement
const searchBtn = document.getElementById("searchBtn")! as HTMLButtonElement

searchInput.onsubmit = () => {
    location.href = "/manga/search/?q=" + encodeURI(searchInput.value)
}

searchBtn.addEventListener("click", () => {
    location.href = "/manga/search/?q=" + encodeURI(searchInput.value)
})
