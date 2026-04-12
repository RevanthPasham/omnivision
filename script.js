// =========================
// MOBILE NAVIGATION TOGGLE
// =========================

// Select hamburger icon and nav menu
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Toggle menu visibility when hamburger is clicked
hamburger.addEventListener('click', () => {
    // Adds/removes 'active' class → controls visibility via CSS
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});


// =========================================
// CLOSE MENU WHEN A NAV LINK IS CLICKED
// =========================================

// Select all links inside nav menu
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        // Remove active classes to close menu
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});


// =========================
// SMOOTH SCROLL NAVIGATION
// =========================

// Select all anchor links that point to sections (#id)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default jump behavior

        // Find the target section
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            // Offset to avoid navbar overlap
            const offsetTop = target.offsetTop - 80;

            // Smooth scroll to section
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});


// =========================
// NAVBAR SCROLL EFFECT
// =========================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Change navbar style after scrolling down
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        navbar.style.boxShadow = 'none';
    }

    // Store last scroll position (not used effectively here)
    lastScroll = currentScroll;
});


// =========================
// ANIMATED COUNTER FUNCTION
// =========================

// Animates numbers increasing from 0 → target
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;

    // Controls speed of increment
    const increment = target / (duration / 16); // ~60fps

    const updateCounter = () => {
        start += increment;

        if (start < target) {
            // Update number during animation
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            // Final value
            element.textContent = target + '+';
        }
    };

    updateCounter();
};


// =========================================
// INTERSECTION OBSERVER FOR COUNTERS
// =========================================

// Triggers animation only when element is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target;

            // Get target number from HTML attribute
            const target = parseInt(statNumber.getAttribute('data-target'));

            // Start animation
            animateCounter(statNumber, target);

            // Stop observing after animation
            statsObserver.unobserve(statNumber);
        }
    });
}, {
    threshold: 0.5 // Trigger when 50% visible
});

// Apply observer to all stat elements
document.querySelectorAll('.stat-number').forEach(stat => {
    statsObserver.observe(stat);
});


// =========================================
// FADE-IN ANIMATION USING OBSERVER
// =========================================

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Make element visible and move it into place
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1 // Trigger early
});

// Apply initial hidden styles + observer
document.querySelectorAll('.expertise-card, .timeline-item, .highlight-item').forEach(item => {
    item.style.opacity = '0'; // Hidden initially
    item.style.transform = 'translateY(30px)'; // Shift down
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    fadeObserver.observe(item);
});


// =========================
// FORM SUBMISSION HANDLER
// =========================

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload

        // Extract form values
        const formData = new FormData(contactForm);
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const subject = contactForm.querySelectorAll('input[type="text"]')[1].value;
        const message = contactForm.querySelector('textarea').value;

        // Button feedback UI
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        submitButton.disabled = true;

        // Clear form inputs
        contactForm.reset();

        // Restore button after 3 seconds
        setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.style.background = '';
            submitButton.disabled = false;
        }, 3000);

        // Debug log (replace with backend API call)
        console.log('Form submitted:', { name, email, subject, message });
    });
}


// =========================
// PARALLAX EFFECT (HERO)
// =========================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');

    if (hero) {
        const shapes = hero.querySelectorAll('.shape');

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;

            // Move elements at different speeds → depth illusion
            shape.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }
});


// =========================================
// ACTIVE NAV LINK HIGHLIGHTING
// =========================================

const sections = document.querySelectorAll('section[id]');

const highlightNavigation = () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        const navLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);

        // Highlight current section link
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink?.classList.add('active');
        } else {
            navLink?.classList.remove('active');
        }
    });
};

window.addEventListener('scroll', highlightNavigation);


// =========================
// TYPEWRITER EFFECT
// =========================

// Types text letter by letter
const typeWriter = (element, text, speed = 100) => {
    let i = 0;
    element.textContent = '';

    const type = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };

    type();
};


// =========================
// PAGE LOAD INITIALIZATION
// =========================

window.addEventListener('load', () => {
    console.log('Portfolio loaded successfully!');
});


// =========================
// CUSTOM CURSOR EFFECT
// =========================

// Create cursor element
let cursor = document.createElement('div');

cursor.className = 'custom-cursor';

// Inline styles (bad practice for scaling, but fine for demo)
cursor.style.cssText = `
    width: 20px;
    height: 20px;
    border: 2px solid rgba(99, 102, 241, 0.5);
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.1s ease;
    display: none;
`;

document.body.appendChild(cursor);

// Move cursor with mouse
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
    cursor.style.display = 'block';
});

// Hide cursor when leaving window
document.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
});


// =========================================
// CURSOR HOVER EFFECT (INTERACTIVE ELEMENTS)
// =========================================

document.querySelectorAll('a, button').forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.borderColor = 'rgba(99, 102, 241, 1)';
    });

    element.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.borderColor = 'rgba(99, 102, 241, 0.5)';
    });
});