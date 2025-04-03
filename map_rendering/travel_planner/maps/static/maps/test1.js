document.addEventListener("DOMContentLoaded", async () => {
    console.log("JS Loaded, initializing...");

    try {
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
    }

    init(); // Initialize the app
});

// Global state
let destinations = [];
let tripName = "My Trip";
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
const editBtn = document.querySelector(".edit-btn");
const saveBtn = document.querySelector(".save-btn");

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
    if (sidebarToggleBtn && sidebarEl) {
        sidebarToggleBtn.removeEventListener("click", toggleSidebar);
        sidebarToggleBtn.addEventListener("click", toggleSidebar);
    }
    if (tripDetailsForm) {
        tripDetailsForm.removeEventListener("submit", handleTripFormSubmit);
        tripDetailsForm.addEventListener("submit", handleTripFormSubmit);
    }
    if (addDestinationBtn) {
        addDestinationBtn.removeEventListener("click", addDestinationHandler);
        addDestinationBtn.addEventListener("click", addDestinationHandler);
    }
    if (addSubstopBtn) {
        addSubstopBtn.removeEventListener("click", addSubstopHandler);
        addSubstopBtn.addEventListener("click", addSubstopHandler);
    }
    if (destinationInput) {
        destinationInput.removeEventListener("keydown", enterHandler);
        destinationInput.addEventListener("keydown", enterHandler);
    }
    if (editBtn) {
        editBtn.removeEventListener("click", openTripModal);
        editBtn.addEventListener("click", openTripModal);
    }

    function openTripModal() {
        if (tripSetupModal) {
            tripSetupModal.classList.add("active");
        } else {
            console.error("Trip setup modal not found!");
        }
    }
}


// Helper functions
function toggleSidebar() {
    sidebarEl.classList.toggle("collapsed");
}

function addDestinationHandler() {
    addDestination(false);
}

function addSubstopHandler() {
    addDestination(true);
}

function enterHandler(e) {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent duplicate calls
        addDestination(false);
    }
}

async function handleTripFormSubmit(event) {
    event.preventDefault(); // Prevent page reload

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
            document.getElementById("tripSetupModal").classList.remove("active");
            loadUserTrips();
        } else {
            console.error("Error creating trip:", response);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

async function addDestination(isSubStop) {
    const destinationName = destinationInput.value.trim();
    if (!destinationName) return;

    if (destinations.some(dest => dest.name.toLowerCase() === destinationName.toLowerCase())) {
        alert("Destination already added!");
        return;
    }

    const coordinates = await geocodeLocation(destinationName);
    if (!coordinates) {
        alert("Location not found!");
        return;
    }

    // Save stop to the backend
    try {
        const response = await fetch("/save_stop/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(),
            },
            body: JSON.stringify({
                trip_id: currentTripId,  // Replace with the actual trip ID
                name: destinationName,
                lat: coordinates.lat,
                lng: coordinates.lng,
            }),
        });

        if (response.ok) {
            console.log("Stop saved successfully!");
        } else {
            console.error("Error saving stop:", await response.json());
        }
    } catch (error) {
        console.error("Error:", error);
    }

    destinations.push({ id: generateId(), name: destinationName, coordinates, isSubStop });
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

// Initialize Google Maps
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // Default to India
        zoom: 5,
    });
}


function updateMapMarkers() {
    destinations.forEach(dest => {
        console.log("Destination:", dest); // Debug: Check destination data
        if (!dest.coordinates || !dest.coordinates.lat || !dest.coordinates.lng) {
            console.error("Invalid destination coordinates:", dest);
            return;
        }
        new google.maps.Marker({
            position: { lat: dest.coordinates.lat, lng: dest.coordinates.lng },
            map: map,
        });
    });
}
 



function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

document.addEventListener("DOMContentLoaded", init);

async function fetchTrips() {
    try {
        const response = await fetch("/api/get_trips/");
        const textData = await response.text();
        console.log("Raw API Response:", textData); // Debugging

        const data = JSON.parse(textData); // Convert to JSON
        console.log("Parsed Data:", data);

        if (!data.trips || !Array.isArray(data.trips)) {
            throw new Error("Invalid API response structure");
        }

        tripName = data.trips[0].name;
        destinations = data.trips[0].destinations || [];

        renderDestinationsList();
        updateMapMarkers();
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
            renderTrips(trips);
        } else {
            console.log("No trips found. Showing trip setup modal.");
            document.getElementById("tripSetupModal").classList.add("active");
        }
    } catch (error) {
        console.error("Error fetching trips:", error);
    }
}
// for directions between places


