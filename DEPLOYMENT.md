# Deployment Guide for Vercel

## Pre-Deployment Checklist ✅

- ✅ **Test files removed**: Removed `resource-planner-test.tsx` and `resource-planner-simple.tsx`
- ✅ **Console logs cleaned**: Removed debug console logs from production code
- ✅ **Zone.Identifier files removed**: Cleaned up Windows metadata files
- ✅ **Middleware optimized**: Fixed edge runtime compatibility issues for Vercel
- ✅ **Build successful**: `npm run build` completes without errors (middleware: 53.6 kB)
- ✅ **Environment example provided**: `.env.example` created with all required variables
- ✅ **Gitignore configured**: Proper `.gitignore` file in place
- ✅ **Vercel config**: `vercel.json` configured with `--legacy-peer-deps`

## Vercel Deployment Steps

### 1. Push to Git Repository
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Import your repository
4. Select the project root directory

### 3. Configure Environment Variables
In your Vercel dashboard, add these environment variables:

**Required:**
- `MONGODB_URI` - Your MongoDB connection string (MongoDB Atlas recommended)
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - Generate a random secret key
- `NODE_ENV=production`

**For Freshdesk Integration:**
- `FRESHDESK_API_KEY` - Your Freshdesk API key
- `FRESHDESK_DOMAIN` - Your Freshdesk subdomain

**For JIRA Integration (Optional):**
- `JIRA_API_TOKEN` - Your JIRA API token
- `JIRA_EMAIL` - Your JIRA email
- `JIRA_BASE_URL` - Your JIRA instance URL

### 4. Deploy
Click "Deploy" - Vercel will automatically:
- Install dependencies with `--legacy-peer-deps`
- Build the application
- Deploy to production

## Post-Deployment Tasks

### 1. Database Setup
- Ensure your MongoDB Atlas cluster is properly configured
- Whitelist Vercel's IP addresses or use 0.0.0.0/0 for access
- Initialize the database with the first admin user via `/api/init`

### 2. Test Core Features
- [ ] Login functionality
- [ ] Analytics dashboard
- [ ] Priority Tracker
- [ ] CSI Tracker  
- [ ] Resource Planner
- [ ] User management (admin only)

### 3. User Onboarding
- Create admin users through `/api/init`
- Set up user permissions and roles
- Configure Freshdesk and JIRA integrations

## Application Features

### Authentication & Authorization
- Role-based access control
- NextAuth.js integration
- Session management

### Core Modules
1. **Analytics Dashboard** - Ticket metrics and SLA tracking
2. **Priority Tracker** - High priority issue management
3. **CSI Tracker** - Continual service improvement tracking
4. **Resource Planner** - Calendar-based resource scheduling
5. **JIRA Integration** - Connect with Atlassian JIRA
6. **User Management** - Admin user control panel

### Performance Optimizations
- Static page generation where possible
- Optimized bundle sizes
- Efficient database queries with MongoDB aggregation
- Image optimization for charts and exports

## Monitoring & Maintenance

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track deployment success rates

### Database Monitoring
- Monitor MongoDB Atlas performance
- Set up alerts for connection issues
- Regular database backups

### Error Tracking
- Monitor application errors in Vercel dashboard
- Set up email alerts for critical failures
- Regular log review

## Troubleshooting

### Common Deployment Issues

**MIDDLEWARE_INVOCATION_FAILED Error:**
- Fixed in this version with optimized middleware
- Middleware is now edge runtime compatible
- Reduced middleware size to 53.6 kB

**Build Failures:**
- Use `npm install --legacy-peer-deps` (configured in vercel.json)
- MongoDB connection errors during build are normal
- Ensure all environment variables are set

**Runtime Issues:**
- Check Vercel function logs
- Verify MongoDB Atlas whitelist includes Vercel IPs
- Ensure NEXTAUTH_SECRET is set correctly

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Ensure MongoDB connection string is valid
4. Check API rate limits for external services
5. If middleware issues persist, check edge runtime compatibility

## Security Considerations

- Keep all API keys and secrets in environment variables
- Use strong NEXTAUTH_SECRET
- Regularly rotate API keys
- Monitor access logs
- Keep dependencies updated