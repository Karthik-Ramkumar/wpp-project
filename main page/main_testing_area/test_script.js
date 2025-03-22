const board = document.getElementById("board");
const modeToggle = document.getElementById("mode-toggle");
let isDarkMode = true; // Default to dark mode

document.addEventListener("DOMContentLoaded", () => {
    // Apply default dark mode
    document.body.style.background = "linear-gradient(45deg, rgb(248, 248, 248), rgb(4, 174, 172), rgb(226, 85, 2))";
    board.style.background = "linear-gradient(-90deg, #464646, #9f9f9f)";
});

// Toggle dark/light mode
modeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;

    // Preserve background image and apply gradient overlay
    document.body.style.background = isDarkMode
        ? "url('background.jpg') no-repeat center center fixed, linear-gradient(45deg, rgb(248, 248, 248), rgb(4, 174, 172), rgb(226, 85, 2))"
        : "url('background.jpg') no-repeat center center fixed, linear-gradient(45deg, #f65656, #f4a264, #69eaea, #5360eb, #cb6fea)";
    document.body.style.backgroundSize = "cover";

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


document.addEventListener("DOMContentLoaded", () => {       
    document.body.style.background = "url('background.jpg') no-repeat center center fixed";
    document.body.style.backgroundSize = "cover";
});