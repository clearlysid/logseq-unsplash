import '@logseq/libs'

const apiKey = "TjzU95V4JHVry7D_iigag7nKd940el7fMBB9KgBLpRY"; // Unsplash Dummy API key

const fetchDataFromUnsplash = async (searchTerm: string, currentPage: number) => {
	const endpoint = `https://api.unsplash.com/search/photos`
	const params = `?query=${encodeURIComponent(searchTerm)}&per_page=30&page=${currentPage}&client_id=${apiKey}`
	const response = await fetch(endpoint + params)
	if (!response.ok) throw Error(response.statusText)
	const json = await response.json()
	return json
}

/**
 * main entry
 */
async function main() {
	const appUserConfig = await logseq.App.getUserConfigs()
	const container = document.createElement('div')
	document.getElementById('app').appendChild(container)
	container.classList.add('unsplash-wrapper')

	const createUnsplash = () => {

		let currentPage = 1
		let searchTerm: string

		// Create input field
		const form = document.createElement("form")
		form.classList.add('search-form')
		form.addEventListener("submit", (event: Event) => {
			event.preventDefault()
			currentPage = 1

			const inputValue: string = (<HTMLInputElement>(
				document.querySelector(".search-input")
			)).value
			searchTerm = inputValue.trim()
			fetchResults(searchTerm)
		})
		
		form.innerHTML = `
			<input class="search-input" type="search" value="" placeholder="Search Unsplash" />
			<button class="search-button" type="submit" >Search</button>
		`

		container.appendChild(form)


		// Create image grid for search results

		const resultContainer = document.createElement("div")
		resultContainer.classList.add("result-container")
		container.appendChild(resultContainer)

		const searchResultsBox = document.createElement("div")
		searchResultsBox.classList.add("search-results")
		resultContainer.appendChild(searchResultsBox)

		const resultColumnLeft = document.createElement("div")
		const resultColumnRight = document.createElement("div")

		searchResultsBox.appendChild(resultColumnLeft)
		searchResultsBox.appendChild(resultColumnRight)


		// Create pagination: WORK IN PROGRESS

		const paginationDiv = document.createElement("div")
		paginationDiv.classList.add("pagination")
		container.appendChild(paginationDiv)

		const buttonPrevious = document.createElement("button")
		buttonPrevious.setAttribute("class", "hidden prev-btn")
		buttonPrevious.innerText = "Previous"
		paginationDiv.appendChild(buttonPrevious)

		const buttonNext = document.createElement("button")
		buttonNext.setAttribute("class", "hidden next-btn")
		buttonNext.innerText = "Next"
		paginationDiv.appendChild(buttonNext)


		buttonNext.addEventListener("click", () => {
			currentPage += 1
			fetchResults(searchTerm)
			document.querySelector(".search-results").animate({ scrollTop: 0 })
		});

		buttonPrevious.addEventListener("click", () => {
			currentPage -= 1
			fetchResults(searchTerm)
			document.querySelector(".search-results").animate({ scrollTop: 0 })
		});

		const pagination = (totalPages: number) => {
			buttonNext.classList.remove("hidden")
			if (currentPage >= totalPages) {
				buttonNext.classList.add("hidden")
			}

			buttonPrevious.classList.add("hidden")
			if (currentPage !== 1) {
				buttonPrevious.classList.remove("hidden")
			}
		}

		async function fetchResults(searchTerm: string) {
			try {
				const results = await fetchDataFromUnsplash(searchTerm, currentPage)
				pagination(results.total_pages)
				displayResults(results)
			} catch (err) {
				console.log(err)
			}
		}

		const displayResults = (json) => {

			resultColumnLeft.innerHTML = ""
			resultColumnRight.innerHTML = ""

			json.results.forEach((result, index) => {
				const imageDesc = result.alt_description
				const imageUrl = result.urls.small
				const photographer = result.user.name
				const photographerPage = result.user.links.html

				const resultItem = document.createElement("div")
				resultItem.classList.add("result-item")

				if (index % 2 === 0) {
					resultColumnLeft.appendChild(resultItem)
				} else {
					resultColumnRight.appendChild(resultItem)
				}

				const resultImage = document.createElement("img")
				resultImage.classList.add("result-image")
				resultImage.src = imageUrl
				resultImage.alt = imageDesc
				resultItem.appendChild(resultImage)

				resultImage.addEventListener("click", () => {
					logseq.Editor.insertAtEditingCursor(`![${imageDesc}](${imageUrl})`)
					logseq.Editor.exitEditingMode()
					logseq.hideMainUI()
				})

				const resultInfo = document.createElement("a")
				resultInfo.classList.add("result-link")
				resultInfo.innerText = photographer
				resultInfo.href = photographerPage
				resultInfo.target = "_blank"
				resultItem.appendChild(resultInfo)
			})
		}

		// Handle escape keypress
		document.addEventListener('keydown', (e) => {
			if (e.key === "Escape") logseq.hideMainUI({ restoreEditingCursor: true })
			e.stopPropagation()
		}, false)

		// Handle click outside window
		document.addEventListener('click', (e) => {
			if (!(e.target as HTMLElement).closest('.unsplash-wrapper')) {
				logseq.hideMainUI({ restoreEditingCursor: true })
			}
		})

		logseq.App.onThemeModeChanged(({ mode }) => {
			// Change plugin window UI colors based on logseq theme
		})
	}

	// Adds slash command for unsplash
	logseq.Editor.registerSlashCommand(
		'Unsplash', async () => {
			const { left, top, rect } = await logseq.Editor.getEditingCursorPosition()
			Object.assign(container.style, {
				top: top + rect.top + 'px',
				left: left + rect.left + 'px',
			})
			logseq.showMainUI()

			setTimeout(() => createUnsplash(), 100)
		},
	)
}

// bootstrap
logseq.ready(main).catch(console.error)
