let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("slide");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        slides[i].classList.remove("active");
    }
    
    slides[slideIndex-1].style.display = "block";
    slides[slideIndex-1].classList.add("active");
    
    // Reset animation for content
    let slideContent = slides[slideIndex-1].querySelector(".slide-content");
    slideContent.style.opacity = "0";
    slideContent.style.transform = "translateY(30px)";
    
    setTimeout(() => {
        slideContent.style.opacity = "1";
        slideContent.style.transform = "translateY(0)";
    }, 100);
}

// Auto slide change
setInterval(() => {
    plusSlides(1);
}, 6000);