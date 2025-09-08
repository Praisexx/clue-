# Nigerian Diaspora Groups Directory

A comprehensive, lightning-fast web directory designed to connect Nigerian diaspora communities worldwide. This platform serves as a centralized hub for discovering, exploring, and connecting with Nigerian organizations, cultural groups, religious communities, and professional associations across the globe.

## 🌟 Key Features

### **Smart Search & Discovery**
- **Intelligent Search Engine** - Handles multiple search intentions automatically:
  - Local searches: *"tennis club around me"*
  - Location-specific: *"fitness groups in Lagos"* 
  - Exact matches: *"Redeemed Christian Church"*
- **Advanced Filtering System** - Filter by category, meeting days, membership type, location, and more
- **Geolocation-Based Discovery** - Find groups near your current location with radius search
- **Real-time Search Suggestions** - Autocomplete for groups, categories, and locations
- **Voice Search Support** - Hands-free search capability

### **Comprehensive Group Profiles**
- **Rich Group Information** - Complete details including description, contact info, meeting schedules
- **Visual Gallery System** - Multiple images with modal lightbox viewer
- **Social Media Integration** - Direct links to Facebook, Instagram, Twitter, LinkedIn, YouTube
- **Click-to-Call Functionality** - Instant phone and WhatsApp contact
- **Contact Modal** - Secure, CAPTCHA-protected messaging system with rate limiting
- **Verification System** - Verified groups for enhanced trust and credibility

### **Advanced Analytics & Insights**
- **View Tracking** - Monitor group profile visits and engagement
- **Click Analytics** - Track contact method usage (phone, email, website)
- **Popular Groups** - Ranking system based on community engagement
- **Performance Metrics** - Real-time analytics for group administrators

### **Content & Community Features**
- **Nigerian News Integration** - Live feed from NGEX API with caching
- **Featured Groups Carousel** - Rotating showcase of highlighted organizations
- **FAQ Section** - Comprehensive help and information center
- **Categorized Directory** - Organized by type: churches, professional groups, cultural associations, student organizations

### **Technical Excellence**
- **Lightning-Fast Performance** - Optimized for speed with lazy loading and caching
- **Mobile-First Design** - Fully responsive across all devices
- **SEO Optimized** - Structured data, XML sitemaps, and search engine friendly
- **Security Hardened** - CAPTCHA protection, rate limiting, SQL injection prevention
- **Accessibility Compliant** - WCAG 2.1 standards for inclusive access
- **PostGIS Integration** - Advanced geospatial queries for location-based features

## 🛠 Technical Stack

- **Backend**: Node.js with Express framework
- **Database**: PostgreSQL with PostGIS for geospatial features
- **Frontend**: Server-side rendered EJS templates with vanilla JavaScript
- **Security**: Comprehensive protection against XSS, SQL injection, CSRF attacks
- **Performance**: Image optimization, lazy loading, intelligent caching
- **SEO**: Schema.org markup, OpenGraph tags, dynamic sitemap generation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL with PostGIS extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/najja-groups-directory.git
   cd najja-groups-directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and configuration
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE naija_groups;
   CREATE EXTENSION postgis;
   ```

5. **Run database migrations**
   ```bash
   # Run all migration files in order
   psql -d naija_groups -f migrations/001_create_groups_table.sql
   psql -d naija_groups -f migrations/002_add_logo_url_column.sql
   # ... continue with all migration files
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Visit your application**
   Open http://localhost:3000 in your browser

## 📦 Deployment

### Recommended: Cloudflare Pages + Supabase

1. **Set up Supabase Database**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Enable PostGIS extension:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```
   - Run all migration files
   - Get your connection string

2. **Deploy to Cloudflare Pages**
   - Push your code to GitHub
   - Connect GitHub repo to Cloudflare Pages
   - Set build command: `npm install`
   - Set build output directory: `/`
   - Add environment variables in Cloudflare dashboard

3. **Environment Variables for Production**
   ```
   DATABASE_URL=postgresql://[supabase-connection-string]
   NODE_ENV=production
   SITE_URL=https://your-domain.pages.dev
   SESSION_SECRET=your-secure-session-secret
   ```

### Alternative Deployment Options
- **Render**: Easy deployment with built-in PostgreSQL
- **Railway**: Simple deployment with database included
- **Heroku**: Traditional PaaS with PostGIS add-ons
- **DigitalOcean App Platform**: Full-stack deployment

## 🎯 Target Audience

- **Diaspora Community Members** - Discover local Nigerian groups and organizations
- **Group Leaders** - Showcase and promote their organizations to a wider audience  
- **Researchers** - Access structured data about Nigerian diaspora organizations
- **Partners & Sponsors** - Connect with communities for collaboration opportunities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Nigerian diaspora communities worldwide
- NGEX API for news integration
- PostGIS for geospatial capabilities
- All contributors and community members

---

Perfect for anyone looking to connect with Nigerian culture, find community support, explore business opportunities, or simply stay connected with their heritage while living abroad.