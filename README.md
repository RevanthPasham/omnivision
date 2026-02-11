OmniVision Platform
===================

This system aggregates employment opportunities.
Data is managed with Sequelize ORM and Postgres DB.

System Design

Backend uses Express with TypeScript stack.
GraphQL layer will be added later.

Main Capabilities

- Scraping from external providers  
- Schema with relations  
- Prevention of duplicate entries  
- Cron based processors  

Setup Guide

1. Download the codebase  
2. Execute npm install  
3. Configure environment file  
4. Launch the server  

Configuration

DATABASE_URL : database string  
APP_PORT : service port  
LOG_MODE : verbose or silent  

Collaboration Rules

Use meaningful commit messages.
Do not ignore eslint warnings.

Planned Improvements

Implement auth module  
Add redis cache  
Create reporting UI  
