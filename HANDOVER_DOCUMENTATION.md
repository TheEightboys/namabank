# 🙏 Namavruksha - Complete Handover Documentation

## Project Overview
**Namavruksha** - The Divine Tree of the Holy Name
- **Main Domain**: https://namavruksha.org
- **English Subdomain**: https://divyavanienglish.namavruksha.org  
- **Tamil Subdomain**: https://divyavanitamil.namavruksha.org

---

## 🔐 All Credentials & Access

### 1. **Appwrite (Backend Database)**
- **Console**: https://nyc.cloud.appwrite.io/console/project-6953d1b2000e392719c6
- **Project ID**: `6953d1b2000e392719c6`
- **Database ID**: `6953dc6900395adffa8c`
- **Bucket ID**: `695420140035b3e66c3a`
- **Endpoint**: `https://nyc.cloud.appwrite.io/v1`

### 2. **Email Service (Brevo/Sendinblue)**
- **Email**: yogiramsuratkumarbhajans@gmail.com
- **API Key**: `[STORED SECURELY IN .ENV FILE - ASK FOR CREDENTIALS]`
- **Dashboard**: https://app.brevo.com/
- **Purpose**: Sends registration & feedback notifications

### 3. **GitHub Repository**
- **Repo**: https://github.com/TheEightboys/namabank
- **Branch**: `main`
- **Access**: Contact repository owner for access

### 4. **Hosting Platforms**
- **Main Site**: Hosted on Vercel (linked to GitHub)
- **Subdomains**: Need to be deployed separately
- **Auto-deploy**: Enabled from GitHub main branch

---

## 🏗️ System Architecture

### **Main Application (React + Vite)**
```
src/
├── pages/           # All page components
├── components/      # Reusable components  
├── services/        # API services (namaService, emailService)
├── context/         # React context (Auth, Toast)
└── assets/         # Images, icons

Key Files:
- src/services/namaService.js - All database operations
- src/services/emailService.js - Email notifications  
- src/context/AuthContext.jsx - Authentication logic
- src/appwriteClient.js - Database configuration
```

### **Subdomain Apps (Firebase + React)**
```
yrsk-english/        # English quotes app
yrsk-tamil/          # Tamil quotes app
Both connect to Firebase for daily quotes
```

---

## 📝 Admin Access & Management

### **Admin Login**
- **URL**: https://namavruksha.org/admin/login
- **Credentials**: 
  - Username: `admin` | Password: `namabank2024`
  - Username: `admin1` | Password: `namabank2024`
  - Username: `admin2` | Password: `namabank2024`
  - Username: `admin3` | Password: `namabank2024`
  - Username: `admin4` | Password: `namabank2024`

### **Admin Features**
- ✅ User management (create, edit, delete users)
- ✅ Bulk user upload (Excel/CSV)
- ✅ Nama account management (Sankalpas)
- ✅ View all Nama entries
- ✅ Moderator management
- ✅ System statistics
- ✅ Feedback management

### **Moderator Login**  
- **URL**: https://namavruksha.org/moderator/login
- **Note**: Moderators are created by Admin
- **Features**: Limited user management, bulk upload

---

## 🗄️ Database Collections (Appwrite)

### **Core Collections:**
1. **users** - User accounts and profiles
2. **nama_accounts** - Sankalpa accounts (devotional goals)  
3. **user_account_links** - Links users to their Sankalpas
4. **nama_entries** - All nama counting records
5. **moderators** - Moderator accounts
6. **prayers** - Prayer submissions
7. **books** - Digital library books
8. **feedback** - User suggestions and reports

### **Key Attributes:**
- Users: name, email, whatsapp, city, state, country
- Nama Entries: user_id, account_id, count, devotee_count, entry_date
- Feedback: type, subject, message, status

---

## 🚀 Deployment Instructions

### **Main Application:**
```bash
# 1. Clone repository
git clone https://github.com/TheEightboys/namabank.git

# 2. Install dependencies  
npm install

# 3. Set environment variables (.env file)
VITE_BREVO_API_KEY=[CONTACT FOR ACTUAL KEY]
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=6953d1b2000e392719c6
VITE_APPWRITE_DATABASE_ID=6953dc6900395adffa8c
VITE_APPWRITE_MEDIA_BUCKET_ID=695420140035b3e66c3a

# 4. Build for production
npm run build

# 5. Deploy to Vercel/Netlify
# Connect to GitHub for auto-deploy
```

### **Subdomain Apps:**
```bash  
# English Subdomain
cd yrsk-english
npm install
npm run build
# Deploy to divyavanienglish.namavruksha.org

# Tamil Subdomain  
cd yrsk-tamil
npm install
npm run build
# Deploy to divyavanitamil.namavruksha.org
```

---

## 🔧 Common Management Tasks

### **1. Adding New Sankalpa (Nama Account)**
- Login as Admin → Namavruksha Sankalpas → Create New
- Set name, dates, target goals
- Link users to new Sankalpa

### **2. Managing Users**
- Bulk Upload: Upload Excel with columns: name, whatsapp, password, city, state, country
- Individual: Create users manually
- Link users to appropriate Sankalpas

### **3. Content Updates**

**Landing Page Changes:**
- Edit: `src/pages/LandingPage.jsx`
- Commit changes to GitHub
- Auto-deploys to live site

**Adding Books/Media:**
- Upload files through Admin panel
- Supports PDF, audio files, images
- Auto-categorizes by file type

**Daily Quotes (Subdomains):**
- Update Firebase collections
- English: quotes collection with date, title, text, imageUrl
- Tamil: Same structure with tamilText field

---

## 📧 Email Notifications

### **Current Setup:**
- **Service**: Brevo (Sendinblue)
- **Notifications sent to**: yogiramsuratkumarbhajans@gmail.com
- **Triggers**: 
  - New user registrations
  - Feedback submissions  
  - Sankalpa requests

### **Email Types:**
1. **Registration**: New devotee joined Sankalpa
2. **Feedback**: General feedback from users
3. **Sankalpa Request**: Request for new Sankalpa
4. **Bug Reports**: Technical issues reported

---

## 🛠️ Technical Support

### **Common Issues & Fixes:**

**1. Email notifications not working:**
- Check Brevo API key in .env file
- Verify email service in src/services/emailService.js

**2. Database connection errors:**
- Verify Appwrite credentials
- Check project ID and endpoints

**3. Subdomain date issues:**
- Ensure IST timezone handling in Firebase queries
- Check date format in quotes collection

**4. Bulk upload failing:**
- Verify Excel format (name, whatsapp, password columns)
- Check for duplicate users

---

## 📱 Future Development - Android App (Feb 2026)

### **Requirements (Pending Discussion with Mr. Balaji):**
- Simple mobile interface for nama counting
- Offline capability for rural devotees  
- Push notifications for daily reminders
- Integration with main web app database

### **Suggested Technology Stack:**
- React Native (code reuse from web app)
- Appwrite SDK for mobile
- Offline-first data sync

---

## 🔒 Security Notes

### **Important:**
- Never commit API keys to GitHub
- Use environment variables for all secrets
- Brevo API key is in .env file (not in code)
- Admin passwords are hardcoded (secure change recommended)

### **Backup Strategy:**
- Appwrite has built-in backups
- Export user data regularly through Admin panel
- Keep local copies of important configurations

---

## 📞 Support Contacts

**For Technical Issues:**
- Repository: https://github.com/TheEightboys/namabank
- Issues: Create GitHub issues for bug reports

**For Content/Business Issues:**  
- Email: yogiramsuratkumarbhajans@gmail.com
- Contact through website feedback forms

---

## ✅ Completed Fixes (January 2026)

1. ✅ **Invest Nama Dates** - Now creates entries for selected date range
2. ✅ **Email Notifications** - Brevo integration for registrations  
3. ✅ **Feedback Forms** - Fixed all submission issues
4. ✅ **Devotees Counting** - Fixed multiplication bug
5. ✅ **Audio Auto-Count** - Added debouncing for accurate counting
6. ✅ **Subdomain Links** - Added to main landing page
7. ✅ **Tamil Header** - Fixed incorrect Tamil text
8. ✅ **Date/Time Issues** - IST timezone handling

---

**🙏 Yogi Ramsuratkumar Jaya Guru Raya! 🙏**

*Last Updated: January 18, 2026*