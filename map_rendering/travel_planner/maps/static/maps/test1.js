document.addEventListener("DOMContentLoaded", async () => {
    console.log("JS Loaded, initializing...");

    /*try {
        const userResponse = await fetch('/whoami/');
        const userData = await userResponse.json();

        if (userData.username) {
            console.log("Logged in as:", userData.username);
            loadUserTrips(userData.username);
        } else {
            console.log("User not logged in.");
        }
    } catch (error) {
        console.error("Error fetching user:", error);
    }*/

    init(); // Initialize the app
});

// Global state
let destinations = [];
let tripName = "My Trip";
let currentTripId = null;
let map;
let markers = [];

// DOM elements
const sidebarEl = document.getElementById("sidebar");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const tripSetupModal = document.getElementById("tripSetupModal");
const tripDetailsForm = document.getElementById("tripDetailsForm");
const destinationInput = document.getElementById("destinationInput");
const addDestinationBtn = document.getElementById("addDestinationBtn");
const addSubstopBtn = document.getElementById("addSubstopBtn");
const destinationsList = document.getElementById("destinationsList");

function init() {
    fetchTrips();
    setupEventListeners();

    if (window.google && window.google.maps) {
        initMap();
    } else {
        console.error("Google Maps API failed to load.");
    }
}

function setupEventListeners() {
    sidebarToggleBtn?.addEventListener("click", toggleSidebar);
    tripDetailsForm?.addEventListener("submit", handleTripFormSubmit);
    addDestinationBtn?.addEventListener("click", () => addDestination(false));
    addSubstopBtn?.addEventListener("click", () => addDestination(true));
    destinationInput?.addEventListener("keydown", (e) => { //changed to make sure function gets called once whethere key press or enter
        if (e.key === "Enter") {
            e.preventDefault();
            if (document.activeElement !== addDestinationBtn) {
                addDestination(false);
            }
        }
    });
}

function toggleSidebar() {
    sidebarEl.classList.toggle("collapsed");
}

async function handleTripFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(tripDetailsForm);
    const tripData = {
        name: formData.get("tripName"),
        start_date: formData.get("startDate"),
        end_date: formData.get("endDate"),
        travel_mode: formData.get("travelMode")
    };

    try {
        const response = await fetch('/trips/create/', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },
            body: JSON.stringify(tripData)
        });

        if (response.ok) {
            console.log("Trip Created Successfully!");
            const data = await response.json();
            currentTripId = data.trip_id; // Store trip ID
            tripSetupModal.classList.remove("active");
            loadUserTrips();
        } else {
            console.error("Error creating trip:", await response.text());
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

let addingDestination = false;

async function addDestination(isSubStop) {
    if (addingDestination) return;
    addingDestination = true;

    const destinationName = destinationInput.value.trim();
    if (!destinationName) {
        addingDestination = false;
        return;
    }

    if (destinations.some(dest => dest.name.toLowerCase() === destinationName.toLowerCase())) {
        alert("Destination already added!");
        addingDestination = false;
        return;
    }

    const coordinates = await geocodeLocation(destinationName);
    if (!coordinates) {
        alert("Location not found!");
        addingDestination = false;
        return;
    }

    try {
        const response = await fetch("/save_stop/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({
                //trip_id: currentTripId,
                name: destinationName,
                lat: coordinates.lat,
                lng: coordinates.lng,
            }),
        });

        if (!response.ok) {
            console.error("Error saving stop:", await response.json());
        }
    } catch (error) {
        console.error("Error:", error);
    }
    addingDestination = false;
    destinations.push({ name: destinationName, lat: coordinates.lat, lng: coordinates.lng, isSubStop }); // removed id: generateId()
    destinationInput.value = "";
    renderDestinationsList();
    updateMapMarkers();

    
}

async function geocodeLocation(locationName) {
    try {
        const response = await fetch(`/geocode/?place=${encodeURIComponent(locationName)}`);
        const data = await response.json();

        if (data.lat !== undefined && data.lng !== undefined) {
            return { lat: data.lat, lng: data.lng };
        } else {
            console.error("Invalid location data:", data);
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

function renderDestinationsList() {
    if (!destinationsList) return;

    destinationsList.innerHTML = "";
    destinations.forEach((dest) => {
        const destEl = document.createElement("div");
        destEl.className = `destination-item ${dest.isSubStop ? "sub" : "main"}`;
        destEl.innerHTML = `<span>${dest.name}</span><button class="remove-btn" data-id="${dest.id}">X</button>`;
        destinationsList.appendChild(destEl);
    });

    document.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => removeDestination(btn.getAttribute("data-id")));
    });
}

function removeDestination(id) {
    destinations = destinations.filter((d) => d.id !== id);
    renderDestinationsList();
    updateMapMarkers();
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
    });
}

function updateMapMarkers() {
    if (!map) {
        console.error("Map not initialized!");
        return;
    }

    markers.forEach(marker => marker.setMap(null)); // Clear old markers
    markers = [];

    destinations.forEach(dest => {
        if (!dest.lat || !dest.lng || isNaN(dest.lat) || isNaN(dest.lng)) {
            console.error("Invalid destination coordinates:", dest);
            return;
        }

        new google.maps.marker.AdvancedMarkerElement({
            position: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lng) },
            map: map,
        });

        markers.push(marker);
    });
}

/*function generateId() {
    return Math.random().toString(36).substr(2, 9);
}*/

async function fetchTrips() {
    try {
        const response = await fetch('/trips/');
        const textData = await response.text();
        console.log("Raw API Response:", textData);

        const data = JSON.parse(textData);
        console.log("Parsed Data:", data);

        if (!data.trips || !Array.isArray(data.trips)) {
            throw new Error("Invalid API response structure");
        }

        if (data.trips.length > 0) {
            currentTripId = data.trips[0].id;
            tripName = data.trips[0].name;
            destinations = data.trips[0].destinations || [];

            renderDestinationsList();
            updateMapMarkers();
        }
    } catch (error) {
        console.error("Error fetching trips:", error);
    }
}

async function loadUserTrips(username) {
    try {
        const response = await fetch(`/trips/?user=${username}`);
        const trips = await response.json();

        if (trips.length > 0) {
            console.log("Existing trips found:", trips);
            currentTripId = trips[0].id;
            renderDestinationsList();
            updateMapMarkers();
        } else {
            console.log("No trips found. Showing trip setup modal.");
            tripSetupModal.classList.add("active");
        }
    } catch (error) {
        console.error("Error fetching trips:", error);
    }
}
