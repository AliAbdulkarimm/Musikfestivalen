// Funktion för att översätta veckodagar till svenska
const translateDayToSwedish = (englishDay) => {
    const daysInSwedish = {
        Monday: "Måndag",
        Tuesday: "Tisdag",
        Wednesday: "Onsdag",
        Thursday: "Torsdag",
        Friday: "Fredag",
        Saturday: "Lördag",
        Sunday: "Söndag",
    };
    return daysInSwedish[englishDay] || englishDay;
};

// Hämtar data från API:et och hanterar filtrering samt rendering
const fetchData = async () => {
    try {
        const baseUrl = "https://cdn.contentful.com/spaces/";
        const SPACE_ID = localStorage.getItem("space_id");
        const ACCESS_TOKEN = localStorage.getItem("access_token");

        if (!SPACE_ID || !ACCESS_TOKEN) {
            throw new Error("API-nycklar saknas i localStorage.");
        }

        const apiURL = `${baseUrl}${SPACE_ID}/entries?access_token=${ACCESS_TOKEN}&content_type=artist`;
        const response = await fetch(apiURL);

        if (!response.ok) {
            throw new Error("HTTP-fel! Något gick snett i förfrågan.");
        }

        const data = await response.json();
        console.log("Hämtad data:", data);

        // Funktion för att hitta referenser från `includes.Entry`
        const getReferencedData = (id) => {
            return data.includes.Entry.find((entry) => entry.sys.id === id)?.fields || {};
        };

        const populateFilters = () => {
            const genres = data.includes.Entry.filter((entry) => entry.sys.contentType.sys.id === "genre");
            const days = data.includes.Entry.filter((entry) => entry.sys.contentType.sys.id === "day");
            const stages = data.includes.Entry.filter((entry) => entry.sys.contentType.sys.id === "stage");

            genres.forEach((genre) => {
                const option = document.createElement("option");
                option.value = genre.fields.name;
                option.textContent = genre.fields.name;
                document.getElementById("genre-filter").appendChild(option);
            });

            days.forEach((day) => {
                const englishDay = day.fields.description;
                const swedishDay = translateDayToSwedish(englishDay);
                const option = document.createElement("option");
                option.value = englishDay;
                option.textContent = `${swedishDay} (${day.fields.date.split('T')[0]})`;
                document.getElementById("day-filter").appendChild(option);
            });

            stages.forEach((stage) => {
                const option = document.createElement("option");
                option.value = stage.fields.name;
                option.textContent = stage.fields.name;
                document.getElementById("stage-filter").appendChild(option);
            });
        };

        const renderArtists = (filter = {}) => {
            const contentDiv = document.getElementById("content");
            contentDiv.innerHTML = ""; // Rensar tidigare innehåll // ta bort inner html

            const filteredArtists = data.items.filter((artist) => {
                const genre = artist.fields.genre ? getReferencedData(artist.fields.genre.sys.id).name : "Okänd genre";
                const dayObj = artist.fields.day ? getReferencedData(artist.fields.day.sys.id) : {};
                const englishDay = dayObj.description || "Okänd dag";
                const swedishDay = translateDayToSwedish(englishDay);
                const day = dayObj.description ? `${swedishDay} (${dayObj.date.split('T')[0]})` : "Okänd dag";
                const stage = artist.fields.stage ? getReferencedData(artist.fields.stage.sys.id).name : "Okänd scen";

                if (filter.genre && filter.genre !== genre) return false;
                if (filter.day && filter.day !== dayObj.description) return false;
                if (filter.stage && filter.stage !== stage) return false;
                return true;
            });

            if (filteredArtists.length === 0) {
                contentDiv.innerHTML = "<p>Inga artister hittades.</p>";
                return;
            }

            filteredArtists.forEach((artist) => {
                const genre = artist.fields.genre ? getReferencedData(artist.fields.genre.sys.id).name : "Okänd genre";
                const dayObj = artist.fields.day ? getReferencedData(artist.fields.day.sys.id) : {};
                const englishDay = dayObj.description || "Okänd dag";
                const swedishDay = translateDayToSwedish(englishDay);
                const day = dayObj.description ? `${swedishDay} (${dayObj.date.split('T')[0]})` : "Okänd dag";
                const stage = artist.fields.stage ? getReferencedData(artist.fields.stage.sys.id).name : "Okänd scen";
                const description = artist.fields.description || "Ingen beskrivning tillgänglig.";

                const artistCard = document.createElement("div");
                artistCard.classList.add("artist-card");

                artistCard.innerHTML = `
                    <h3>${artist.fields.name || "Okänd artist"}</h3>
                    <p><strong>Genre:</strong> ${genre}</p>
                    <p><strong>Dag:</strong> ${day}</p>
                    <p><strong>Scen:</strong> ${stage}</p>
                    <p><strong>Beskrivning:</strong> ${description}</p>
                `;

                contentDiv.appendChild(artistCard);
            });
        };

        // Rendera artister vid laddning
        populateFilters();
        renderArtists();

        // Eventlyssnare för filtrering
        document.getElementById("filter-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const genre = document.getElementById("genre-filter").value;
            const day = document.getElementById("day-filter").value;
            const stage = document.getElementById("stage-filter").value;
            renderArtists({ genre, day, stage });
        });
    } catch (error) {
        console.error("Ett fel inträffade vid hämtning av data:", error);
        document.getElementById("content").innerHTML = `<p class="error">Ett fel inträffade: ${error.message}</p>`;
    }
};

fetchData();
