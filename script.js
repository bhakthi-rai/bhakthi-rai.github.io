let currentPage = 1;
let speechSynthesisObject;

function addHeader(){
 let row = `<tr>
            <td>Title</td>
            <td>Image</td>
            <td>Summary</td>
            <td>Distance</td>
        </tr>`;
         document.getElementById("places-list").innerHTML += row;
}
function fetchWikiImage(title, distance,summary) {
    let imageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(title)}&format=json&pithumbsize=100&exintro=true&explaintext=true&origin=*`;
    fetch(imageUrl)
    .then(response => response.json())
    .then(data => {
        let pages = data.query.pages;
        let imageSrc = "No image available"; // Default text
        let summaryText = "No summary available"; // Default summary message
        for (let pageId in pages) {
            if (pages[pageId].thumbnail) {
                imageSrc = `<img src="${pages[pageId].thumbnail.source}" alt="${title}">`;
            }
            if (pages[pageId].extract) {
                summaryText = pages[pageId].extract; // Store summary
            }
        }


        let row = `<tr>
            <td>${title}</td>
            <td>${imageSrc}</td>
            <td>${summaryText}</td>
            <td>${distance} meters</td>
        </tr>`;
        document.getElementById("places-list").innerHTML += row;
    })
    .catch(error => console.error("Error fetching image:", error));
}
function getNearbyPlaces(lat, lon) {
    let url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=9000&format=json&origin=*`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        let tableBody = document.getElementById("places-list");
        tableBody.innerHTML = "";
        addHeader()
        data.query.geosearch.forEach(place => {
            fetchWikiImage(place.title, place.dist);
        });
    })
    .catch(error => console.error("Error fetching nearby places:", error));
}


function getWikipediaSummary(place) {
    let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`;
    document.getElementById("places-list").textContent="";
    fetch(url)
    .then(response => response.json())
    .then(data => {
        let imageSrc = "No image available"; // Default text
        let summaryText = "No summary available"; // Default summary message

         if (data.thumbnail) {
                imageSrc = `<img src="${data.thumbnail.source}" alt="${place}">`;
            }
            if (data.extract) {
                summaryText = data.extract; // Store summary
            }
        addHeader()
        let row = `<tr>
            <td>${place}</td>
            <td>${imageSrc}</td>
            <td>${summaryText}  </td>
            <td></td>
        </tr>`;
         document.getElementById("places-list").innerHTML += row;
        document.getElementById("playButton").addEventListener("click", function() {
        speakText(summaryText);  // Pass raw text instead of escapedText
        });
    })
    .catch(error => console.error("Error fetching Wikipedia summary:", error));
}

function paginate() {
    currentPage++;
    getPlaceInfo();
}

function speakText(text) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;  // More natural speed
    speechSynthesisObject = utterance;
    speechSynthesis.speak(utterance);
}
function escapeText(text) {
    return text.replace(/[\\"']/g, "\\$&");  // Escapes special characters
}


function stopAudio() {
    speechSynthesis.cancel();  // Stops speech immediately
}

function autoFillLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("searchBox").value = data.display_name;
            getPlaceInfo();
        });
    });
}

function getPlaceCoordinates(placeTitle, callback) {
    let url = `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&titles=${encodeURIComponent(placeTitle)}&format=json&origin=*`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        let pages = data.query.pages;
        for (let key in pages) {
            if (pages[key].coordinates) {
                let lat = pages[key].coordinates[0].lat;
                let lon = pages[key].coordinates[0].lon;
                console.log(`${placeTitle} - Latitude: ${lat}, Longitude: ${lon}`);
                callback(lat, lon); // Pass coordinates to callback
                return;
            }
        }
        callback(null, null); // No coordinates found
    })
    .catch(error => console.error("Error fetching coordinates:", error));
}

function getNearbySearchTextPlaces(placeTitle, radius = 5000) {
    getPlaceCoordinates(placeTitle, function(lat, lon) {
        if (!lat || !lon) {
            console.error("No coordinates found, cannot fetch nearby places.");
            return;
        }
    getNearbyPlaces(lat, lon)

    });
}

function getNearbyMePlaces(placeTitle, radius = 5000) {
    navigator.geolocation.getCurrentPosition(
    function(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        getNearbyPlaces(lat, lon); // Pass coordinates to fetch places
    }
);

}
