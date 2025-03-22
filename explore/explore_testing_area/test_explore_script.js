const soundIcon = document.getElementById('sound-icon');
const ball = document.getElementById('ball');
const audioPlayer = document.getElementById('audio-player');
const board = document.getElementById('board');
const modeToggle = document.getElementById('mode-toggle');
const originalTransform = 'translateZ(0)';
let chargingTime = 0;
let chargingInterval;
let isDarkMode = true; // Default to dark mode

document.addEventListener('DOMContentLoaded', () => {
    // Immediately apply dark mode styles on page load
    document.body.style.background = 'linear-gradient(45deg,rgb(248, 248, 248),rgb(4, 174, 172),rgb(226, 85, 2)';
    board.style.background = 'linear-gradient(-90deg, #464646, #9f9f9f)';
});


// Toggle dark/light mode
modeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.style.background = isDarkMode ?
        'linear-gradient(45deg,rgb(248, 248, 248),rgb(4, 174, 172),rgb(226, 85, 2)' : // Dark mode
        'linear-gradient(45deg, #f65656, #f4a264, #69eaea, #5360eb, #cb6fea)'; // Light mode
    board.style.background = isDarkMode ?
        'linear-gradient(-90deg, #464646, #9f9f9f)' : // Dark mode
        'linear-gradient(-90deg, #f0f0f0, #ffffff)'; // Light mode

    modeToggle.style.opacity = 0; // Start fade-out
    setTimeout(() => {
        modeToggle.src = isDarkMode ? 'darkmode.png' : 'lightmode.png';
        modeToggle.style.opacity = 1; // Fade-in
    }, 500);
});

// Board movement based on mouse position
board.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    const { offsetWidth, offsetHeight } = board;

    const boardRect = board.getBoundingClientRect();
    const centerX = boardRect.left + offsetWidth / 2;
    const centerY = boardRect.top + offsetHeight / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    const tiltX = (deltaY / offsetHeight) * 10; // Max tilt
    const tiltY = (deltaX / offsetWidth) * -10; // Max tilt

    board.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
});

// Reset board position when mouse leaves
board.addEventListener('mouseleave', () => {
    board.style.transform = originalTransform;
});
document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const modeToggle = document.getElementById("mode-toggle");
    let isDarkMode = true;

    // Dark mode styles on load
    document.body.style.background = "linear-gradient(45deg,rgb(248, 248, 248),rgb(4, 174, 172),rgb(226, 85, 2))";
    board.style.background = "linear-gradient(-90deg, #464646, #9f9f9f)";

    // Toggle dark/light mode
    modeToggle.addEventListener("click", () => {
        isDarkMode = !isDarkMode;
        document.body.style.background = isDarkMode
            ? "linear-gradient(45deg,rgb(248, 248, 248),rgb(4, 174, 172),rgb(226, 85, 2))" // Dark mode
            : "linear-gradient(45deg, #f65656, #f4a264, #69eaea, #5360eb, #cb6fea)"; // Light mode
        board.style.background = isDarkMode
            ? "linear-gradient(-90deg, #464646, #9f9f9f)" // Dark mode
            : "linear-gradient(-90deg, #f0f0f0, #ffffff)"; // Light mode

        modeToggle.style.opacity = 0;
        setTimeout(() => {
            modeToggle.src = isDarkMode ? "darkmode.png" : "lightmode.png";
            modeToggle.style.opacity = 1;
        }, 500);
    });

    // Board movement based on mouse position
    board.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;
        const { offsetWidth, offsetHeight } = board;

        const boardRect = board.getBoundingClientRect();
        const centerX = boardRect.left + offsetWidth / 2;
        const centerY = boardRect.top + offsetHeight / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        const tiltX = (deltaY / offsetHeight) * 10;
        const tiltY = (deltaX / offsetWidth) * -10;

        board.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    board.addEventListener("mouseleave", () => {
        board.style.transform = "translateZ(0)";
    });

    // Add interactive map background
    const mapContainer = document.createElement("div");
    mapContainer.id = "map";
    document.body.insertBefore(mapContainer, document.body.firstChild);

    const map = L.map("map", {
        center: [20, 0], // Default center
        zoom: 2,
        layers: [
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
            }),
        ],
    });

    // Add moving airplane markers
    function createMovingPlane(lat, lng, speed, direction) {
        const planeIcon = L.divIcon({
            className: "plane-icon",
            html: "✈️",
            iconSize: [20, 20],
        });

        let marker = L.marker([lat, lng], { icon: planeIcon }).addTo(map);

        function movePlane() {
            lat += Math.cos(direction) * speed;
            lng += Math.sin(direction) * speed;
            marker.setLatLng([lat, lng]);

            if (lat > 90 || lat < -90 || lng > 180 || lng < -180) {
                lat = 20;
                lng = 0;
            }

            setTimeout(movePlane, 200);
        }

        movePlane();
    }

    createMovingPlane(20, 0, 0.1, Math.random() * Math.PI * 2);
    createMovingPlane(30, -20, 0.07, Math.random() * Math.PI * 2);
    createMovingPlane(-10, 50, 0.09, Math.random() * Math.PI * 2);
});
