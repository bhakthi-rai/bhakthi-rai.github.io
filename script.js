let currentPage = 1;
let speechSynthesisObject;

function getWikipediaSummary(place) {
    let url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`;
    fetch(url)
    .then(response => response.json())
    .then(data => {
        document.getElementById("summary").textContent = data.extract || "No information available.";
        if (data.thumbnail) {
            document.getElementById("placeImage").src = data.thumbnail.source; // Set image src
        } else {
            document.getElementById("placeImage").src = "no-image.jpg"; // Fallback image
        }
        let escapedText = escapeText(document.getElementById("summary").textContent );
        document.getElementById("playButton").addEventListener("click", function() {
        let text = document.getElementById("summary").textContent;  // Get summary
        let escapedText = JSON.stringify(text);  // Ensure proper encoding
        speakText(text);  // Pass raw text instead of escapedText
        });
        document.getElementById("places").textContent="";
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
        let url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=${radius}&gscoord=${lat}|${lon}&format=json&origin=*`;
        fetch(url)
        .then(response => response.json())
        .then(data => {
            let placesList = document.getElementById("places");
            placesList.innerHTML = ""; // Clear previous results
            data.query.geosearch.forEach(place => {
                let item = document.createElement("li");
                item.textContent = `${place.title} - Distance: ${place.dist} meters`;
                item.onclick = () => getPlaceCoordinates(place.title, function(lat, lon) {
                }); // Fetch lat/lon on click
                placesList.appendChild(item);
            });
        })
        .catch(error => console.error("Error fetching nearby places:", error));
    });
}

function getNearbyMePlaces(placeTitle, radius = 5000) {
    navigator.geolocation.getCurrentPosition(
    function(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        getNearbyWikiPlaces(lat, lon); // Pass coordinates to fetch places
    }
);



function getNearbyWikiPlaces(lat, lon, radius = 5000) {
    let url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=${radius}&gscoord=${lat}|${lon}&format=json&origin=*`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        let placesList = document.getElementById("places");
        placesList.innerHTML = ""; // Clear previous results

        data.query.geosearch.forEach(place => {
            let item = document.createElement("li");
            item.textContent = `${place.title} - Distance: ${place.dist}m`;
            placesList.appendChild(item);
        });
    })
    .catch(error => console.error("Error fetching nearby places:", error));
}
}
