document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Plan board hover effect
    const planBoard = document.querySelector('.plan-board');
    // if (planBoard) {
    //     planBoard.addEventListener('mouseenter', function() {
    //         this.style.transform = 'translateY(-50%) scale(1.02)';
    //     });
        
    //     planBoard.addEventListener('mouseleave', function() {
    //         this.style.transform = 'translateY(-50%) scale(1)';
    //     });
    // }

    planBoard.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;
        const { offsetWidth, offsetHeight } = planBoard;
    
        const boardRect = planBoard.getBoundingClientRect();
        const centerX = boardRect.left + offsetWidth / 2;
        const centerY = boardRect.top + offsetHeight / 2;
    
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
    
        const tiltX = (deltaY / offsetHeight) * 10;
        const tiltY = (deltaX / offsetWidth) * -10;
    
        planBoard.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    planBoard.addEventListener("mouseleave", () => {
        planBoard.style.transform = "translateZ(0)";
    });
    
    // Button hover effects
    const buttons = document.querySelectorAll('.plan-now-btn, .sub-btn, .card-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            if (this.classList.contains('plan-now-btn')) {
                this.style.transform = 'translateY(-3px)';
            } else {
                this.style.transform = 'translateY(-2px)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add pulse animation to plan now button every 5 seconds
    const planNowBtn = document.querySelector('.plan-now-btn');
    if (planNowBtn) {
        setInterval(() => {
            planNowBtn.classList.add('pulse');
            setTimeout(() => {
                planNowBtn.classList.remove('pulse');
            }, 2000);
        }, 8000);
    }
});

// Contact Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactModal = document.getElementById('contactModal');
    // More specific selector for the Contact link
    const contactNavItem = document.querySelector('.nav-menu li:nth-child(5) a'); 
    const closeModal = document.querySelector('.close-modal');
    
    // Open modal when Contact is clicked
    if (contactNavItem) {
        contactNavItem.addEventListener('click', function(e) {
            e.preventDefault();
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        });
    }
    
    // Close modal when X is clicked
    closeModal.addEventListener('click', function() {
        contactModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside content
    contactModal.addEventListener('click', function(e) {
        if (e.target === contactModal) {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && contactModal.classList.contains('active')) {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});