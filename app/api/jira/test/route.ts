import { NextResponse } from 'next/server';

// Set up global SSL configuration for development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET() {
  try {
    const jiraUrl = process.env.JIRA_URL;
    const jiraUsername = process.env.JIRA_USERNAME;
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    const projectKey = process.env.JIRA_PROJECT_KEY;

    // Check if all required environment variables are set
    if (!jiraUrl || !jiraUsername || !jiraApiToken || !projectKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing JIRA configuration. Please check environment variables.',
        config: {
          jiraUrl: !!jiraUrl,
          jiraUsername: !!jiraUsername,
          jiraApiToken: !!jiraApiToken,
          projectKey: !!projectKey
        }
      });
    }

    // Test basic authentication by calling JIRA's myself endpoint
    const authHeader = Buffer.from(`${jiraUsername}:${jiraApiToken}`).toString('base64');
    const testUrl = `${jiraUrl}/rest/api/3/myself`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `JIRA Authentication Failed: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const userData = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'JIRA connection successful',
      user: userData.displayName,
      jiraUrl,
      projectKey
    });

  } catch (error) {
    console.error('JIRA Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    });
  }
}