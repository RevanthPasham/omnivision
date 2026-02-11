Project OmniVision
==================

This application collects job postings from multiple sources.
It stores structured data using Sequelize and PostgreSQL.

Architecture Overview

The backend is written in Node.js with TypeScript.
REST APIs expose job data to the frontend dashboard.

Core Features

- Automated scraping of job portals  
- Normalized database schema  
- Duplicate detection using source id  
- Scheduled background workers  

Installation Steps

1. Clone the repository  
2. Run npm install  
3. Create .env file  
4. Start development server  

Environment Variables

DATABASE_URL – connection string  
PORT – application port  
LOG_LEVEL – debug or info  

Team Guidelines

Write clean commit messages.
Follow eslint rules strictly.

Future Roadmap

Add authentication module  
Introduce caching layer  
Build analytics dashboard  
