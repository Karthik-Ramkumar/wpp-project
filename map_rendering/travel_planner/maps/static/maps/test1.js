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
    new google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        title: destinationName
    });
    destinationInput.value = "";
    renderDestinationsList();
    drawLineBetweenStops()
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
        btn.addEventListener("click", () => {
            const stopName = btn.closest(".destination-item").querySelector("span").textContent;
            deleteStop(stopName);  // Call deleteStop with the stop name
        });
    });
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
        const response = await fetch('/api/get_trips/');
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
            drawLineBetweenStops()
            updateMapMarkers();
            
        }
    } 
    catch (error) {
        console.error("Error fetching trips:", error);
    }
    try {
        const response = await fetch('/api/get_trips/');
        const data = await response.json();

        if (data.trips.length > 0) {
            const stops = data.trips[0].destinations;
            stops.forEach(stop => {
                new google.maps.Marker({
                    position: { lat: stop.lat, lng: stop.lng },
                    map: map,
                    title: stop.name
                });
            });
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

function removeDestination(id) {
    destinations = destinations.filter((d) => d.id !== id);
    renderDestinationsList();
    updateMapMarkers();
}

let routePath = [];
const colorPalette = [
    '#00BFFF', '#FF6F61', '#32CD32', '#FFD700', '#8A2BE2',
    '#FF5C00', '#40E0D0', '#000000', '#87CEEB', '#FF1493'
];

// Function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function drawLineBetweenStops() {
    if (!window.google || !window.google.maps || destinations.length < 2) return;

    // Clear previous lines if any
    if (routePath.length > 0) {
        routePath.forEach(path => path.setMap(null));
    }

    routePath = []; // Reset routePath array

    // Loop through each pair of stops to create different colored dotted lines
    for (let i = 0; i < destinations.length - 1; i++) {
        const startLat = destinations[i].lat;
        const startLng = destinations[i].lng;
        const endLat = destinations[i + 1].lat;
        const endLng = destinations[i + 1].lng;

        // Calculate distance
        const distance = calculateDistance(startLat, startLng, endLat, endLng).toFixed(2); // Distance in km, rounded to 2 decimal places

        const pathCoordinates = [
            { lat: startLat, lng: startLng },
            { lat: endLat, lng: endLng }
        ];

        const polyline = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: colorPalette[i % colorPalette.length], // Choose a color from the palette
            strokeOpacity: 1.0,
            strokeWeight: 4,
            icons: [{
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 3,
                    strokeColor: colorPalette[i % colorPalette.length], // Dotted line color
                    strokeOpacity: 1,
                    fillOpacity: 0
                },
                offset: "0",
                repeat: "15px" // Adjust the spacing of the dots
            }]
        });

        polyline.setMap(map);
        routePath.push(polyline); // Store the polyline for future removal

        // Add a label showing the distance
        const labelLat = (startLat + endLat) / 2; // Midpoint of the line
        const labelLng = (startLng + endLng) / 2;

        const distanceLabel = new google.maps.Marker({
            position: { lat: labelLat, lng: labelLng },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,  // Hide the marker itself
            },
            label: {
                text: `${distance} km`,
                color: "#000000",
                fontSize: "14px",
                fontWeight: "bold"
            }
        });
    }
}

document.querySelectorAll('.delete-stop').forEach(button => {
    button.addEventListener('click', function () {
        const stopName = this.getAttribute('data-stop');
        
        fetch('/delete_stop/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ stop_name: stopName })  // Ensure this matches Python
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                location.reload();  // Reload the page on success
            } else {
                alert('Failed to delete stop');
            }
        });
    });
});

// CSRF token helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
function deleteStop(stopName) {
    fetch('/delete_stop/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stop: stopName })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        initMap();
        fetchTrips();
        updateMapMarkers();
      } else {
        alert('Failed to delete stop');
      }
    });
}

//---------------------------------------
// Get references to elements
const openExpenseBtn = document.querySelector('.expense-btn');
const closeExpenseBtn = document.getElementById('closeExpenseBtn');
const expensePopup = document.getElementById('expensePopup');
const expenseForm = document.getElementById('expenseForm');
const expensesList = document.getElementById('expenses');
const totalCostElement = document.getElementById('totalCost');

// Event listener to open the pop-up
openExpenseBtn.addEventListener('click', () => {
  expensePopup.style.display = 'block';
});

// Event listener to close the pop-up
closeExpenseBtn.addEventListener('click', () => {
    expensePopup.style.display = 'none';
  });

// Handle form submission (add expense)
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const stopName = document.getElementById('stopName').value;
  const expense = parseFloat(document.getElementById('expense').value);
  const note = document.getElementById('note').value;

  if (stopName && expense) {
    // Create a new list item for the expense
    const expenseItem = document.createElement('li');
    expenseItem.textContent = `${stopName}: ₹${expense} - ${note || 'No note'}`;

    // Add to the expense list
    expensesList.appendChild(expenseItem);

    // Update the total cost
    updateTotalCost(expense);

    // Clear the form
    expenseForm.reset();
  }
});

// Function to update the total cost
function updateTotalCost(expense) {
    const totalCostElement = document.getElementById('totalCost');
    if (totalCostElement) {  // Check if element exists
      let currentTotal = parseFloat(totalCostElement.textContent);
      currentTotal += expense;
      totalCostElement.textContent = currentTotal.toFixed(2);
    } else {
      console.error("Total cost element not found!");
    }
  }
  