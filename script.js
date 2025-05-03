plet currentPage = 1;
let speechSynthesisObject;

function handleEnter(event) {
    if (event.key === "Enter") {
        getPlaceInfo();
    }
}

function getPlaceInfo() {
    let place = document.getElementById("searchBox").value.trim();
    if (place) {
        fetch(`/get_info?place=${place}&page=${currentPage}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("summary").textContent = data.summary;
            document.getElementById("placeImage").src = data.image;
            let escapedText = escapeText(data.summary);
            document.getElementById("playButton").addEventListener("click", function() {
                speakText(data.summary);
            }, { once: true }); // Ensures only one listener is attached

        });
    }
}

function paginate() {
    currentPage++;
    getPlaceInfo();
}

function playAudio() {
    let audio = new Audio(window.audioFile);
    audio.play();
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

function getNearbyPlaces() {
    let place = document.getElementById("searchBox").value.trim();
    if (place) {
        fetch(`/get_nearby_places?place=${place}`)
        .then(response => response.json())
        .then(data => {
            let list = document.getElementById("placesList");
            list.innerHTML = "";  // Clear previous results
            data.places.forEach(p => {
                let item = document.createElement("li");
                item.textContent = p.name;
                item.onclick = () => {
                    document.getElementById("searchBox").value = p.name;
                    getPlaceInfo();
                };
                list.appendChild(item);
            });
        });
    }
}
