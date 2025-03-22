document.addEventListener("DOMContentLoaded", () => {
    console.log("JS Loaded, initializing...");

    // Ensure modal is visible on page load
    const modal = document.getElementById("tripSetupModal");
    if (modal) {
        modal.classList.add("active");
    } else {
        console.error("Trip setup modal not found!");
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
    if (tripSetupModal) {
        tripSetupModal.classList.add("active");
    }
    setupEventListeners();
    if (typeof google !== "undefined" && google.maps) {
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

function handleTripFormSubmit(event) {
    event.preventDefault(); // Prevent page reload

    const formData = new FormData(tripDetailsForm);
    tripName = formData.get("tripName");

    if (!tripName.trim()) {
        alert("Please enter a trip name!");
        return;
    }

    console.log("Trip Created:", { tripName });

    // Hide the modal after successful input
    tripSetupModal.classList.remove("active");
}

async function addDestination(isSubStop) {
    const destinationName = destinationInput.value.trim();
    if (!destinationName) return;

    // Check if destination already exists
    if (destinations.some(dest => dest.name.toLowerCase() === destinationName.toLowerCase())) {
        alert("Destination already added!");
        return;
    }

    const coordinates = await geocodeLocation(destinationName);
    if (!coordinates) {
        alert("Location not found!");
        return;
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
    if (!map) return;

    markers.forEach((marker) => marker.setMap(null)); // Clear old markers
    markers = [];

    let bounds = new google.maps.LatLngBounds();

    destinations.forEach((dest) => {
        const marker = new google.maps.Marker({
            position: dest.coordinates,
            map,
            title: dest.name,
        });
        markers.push(marker);
        bounds.extend(dest.coordinates); // Extend bounds for each marker
    });

    if (destinations.length > 1) {
        map.fitBounds(bounds); // Auto-adjust map to show all markers
    } else if (destinations.length === 1) {
        map.setCenter(destinations[0].coordinates);
        map.setZoom(7); // Set a reasonable zoom level instead of zooming in too much
    }
}



function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

document.addEventListener("DOMContentLoaded", init);

// for directions between places


