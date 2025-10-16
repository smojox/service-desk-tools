# SLA Status Update Cron Job Setup

This document explains how to set up automated SLA status updates for the incident management system.

## Overview

The SLA status update system uses a two-tier approach:

1. **Cron Job (Bulk Updates)**: Periodically updates all open incidents in the database
2. **Real-time Calculation**: Calculates accurate SLA status when viewing individual incidents

This approach balances performance with accuracy:
- Bulk updates prevent database overload with large ticket volumes
- Real-time calculation ensures accurate display when viewing ticket details
- Database values are used for reporting and analytics

## API Endpoint

**Endpoint**: `POST /api/incident-management/incidents/update-sla-statuses`

**Authentication**: Optional API key via `x-api-key` header (recommended for production)

**Response**:
```json
{
  "success": true,
  "message": "Updated SLA statuses for 15 incidents",
  "updatedCount": 15
}
```

## Setting Up the Cron Job

### Option 1: Using Vercel Cron (Recommended for Vercel deployments)

1. Create a `vercel.json` file in the project root:

```json
{
  "crons": [
    {
      "path": "/api/incident-management/incidents/update-sla-statuses",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes.

2. Set the `CRON_API_KEY` environment variable in Vercel for security.

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Create a scheduled job that calls:
   ```
   POST https://your-domain.com/api/incident-management/incidents/update-sla-statuses
   ```

2. Add header:
   ```
   x-api-key: your-secret-api-key
   ```

3. Set schedule: `*/5 * * * *` (every 5 minutes)

### Option 3: Server-based Cron (Linux/Unix)

1. Add to crontab:
   ```bash
   */5 * * * * curl -X POST -H "x-api-key: your-secret-api-key" https://your-domain.com/api/incident-management/incidents/update-sla-statuses
   ```

### Option 4: GitHub Actions (for GitHub-hosted projects)

1. Create `.github/workflows/update-sla.yml`:

```yaml
name: Update SLA Statuses

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual triggering

jobs:
  update-sla:
    runs-on: ubuntu-latest
    steps:
      - name: Call SLA Update API
        run: |
          curl -X POST \
            -H "x-api-key: ${{ secrets.CRON_API_KEY }}" \
            https://your-domain.com/api/incident-management/incidents/update-sla-statuses
```

2. Add `CRON_API_KEY` to GitHub Secrets

## Recommended Schedule

- **Every 5 minutes** (`*/5 * * * *`): Best for production with active SLAs
- **Every 15 minutes** (`*/15 * * * *`): Good for moderate traffic
- **Every hour** (`0 * * * *`): Acceptable for low-traffic systems

## Environment Variables

Add to your `.env.local`:

```env
# Optional: API key for cron job authentication
CRON_API_KEY=your-very-secret-api-key-here
```

**Note**: If `CRON_API_KEY` is not set, the endpoint will be unprotected (suitable for development).

## SLA Status Logic

The system calculates SLA status based on time remaining:

- **Within SLA**: 20% or more of time remaining
- **At Risk**: Less than 20% of time remaining
- **Breached**: Past the due time (timeRemaining ≤ 0)

### Example:
- Incident created: 10:00 AM
- Due time: 2:00 PM (4 hours SLA)
- Current time: 1:00 PM (3 hours elapsed, 1 hour remaining)
- Percent remaining: (1h / 4h) × 100 = 25%
- **Status**: Within SLA ✅

## Monitoring

### Manual Trigger
You can manually trigger the update by visiting:
```
GET https://your-domain.com/api/incident-management/incidents/update-sla-statuses
```

### Logging
Check your application logs for messages like:
```
Updated SLA statuses for 15 incidents
```

### Performance
- Bulk operations use MongoDB `bulkWrite` for efficiency
- Only updates incidents that actually changed status
- Typically completes in under 1 second for 1000 incidents

## Troubleshooting

### Cron job not running
1. Check cron service logs
2. Verify the API key is correct
3. Test endpoint manually with curl

### Incorrect SLA statuses
1. Verify SLA definitions are correct
2. Check incident creation times and due times
3. Ensure server timezone is correct (calculations use server time)

### Performance issues
1. Increase cron interval (e.g., every 15 minutes instead of 5)
2. Add database indexes on `status` and `slaStatus` fields
3. Consider archiving old closed incidents

## Database Indexes

For optimal performance, ensure these indexes exist:

```javascript
db.incidents.createIndex({ status: 1, slaStatus: 1 })
db.incidents.createIndex({ dueByTime: 1 })
db.incidents.createIndex({ createdAt: -1 })
```

These are automatically created when incidents are first created.
