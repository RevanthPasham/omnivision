# Revanth - Tech Leader Portfolio

A stunning, professional portfolio website showcasing Revanth as a tech leader, boss of developers, and technology evangelist.

## 🚀 Features

- **Modern Design**: Sleek, professional design with gradient effects and smooth animations
- **Fully Responsive**: Works perfectly on all devices (desktop, tablet, mobile)
- **Interactive Elements**: Smooth scrolling, animated counters, parallax effects
- **Professional Sections**:
  - Hero section with impressive introduction
  - About section highlighting leadership
  - Expertise showcase with tech stack
  - Achievements timeline
  - Contact form

## 📁 Project Structure

```
xstream/
├── index.html      # Main HTML file
├── styles.css      # All styling and animations
├── script.js       # Interactive JavaScript features
└── README.md       # This file
```

## 🛠️ Setup Instructions

### Option 1: Direct Opening
Simply open `index.html` in your web browser. No installation required!

### Option 2: Local Server (Recommended)
For the best experience, use a local server:

#### Using Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

#### Using Node.js (http-server):
```bash
npx http-server
```

#### Using VS Code:
Install the "Live Server" extension and click "Go Live" in the status bar.

## 🎨 Customization

### Update Personal Information
1. **Name & Title**: Edit the hero section in `index.html`
2. **Stats**: Modify the numbers in the hero stats section
3. **About Section**: Update the about content in `index.html`
4. **Contact Info**: Change email, phone, and location in the contact section
5. **Social Links**: Update social media links in the contact section

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #ec4899;
    /* ... more variables */
}
```

### Add Your Photo
Replace the placeholder in the about section:
```html
<div class="image-placeholder">
    <img src="your-photo.jpg" alt="Revanth">
</div>
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🎯 Key Sections

1. **Hero**: Eye-catching introduction with animated stats
2. **About**: Leadership and vision
3. **Expertise**: Technical skills and technologies
4. **Achievements**: Timeline of accomplishments
5. **Contact**: Contact form and social links

## 🔧 Technologies Used

- HTML5
- CSS3 (with CSS Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts (Inter)

## 📝 Notes

- The contact form currently shows a success message. To make it functional, integrate with a backend service or email service like Formspree, EmailJS, etc.
- All animations are optimized for performance
- The design is fully responsive and mobile-friendly

## 🌟 Features Highlights

- Smooth scroll navigation
- Animated statistics counters
- Parallax effects
- Intersection Observer animations
- Mobile-responsive hamburger menu
- Custom cursor effects
- Gradient backgrounds and effects

## 📄 License

This portfolio is created for personal use. Feel free to customize it for your own portfolio!

---

**Built with ❤️ for Revanth - The Boss of Developers**
