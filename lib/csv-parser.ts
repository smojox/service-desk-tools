export interface TicketData {
  ticketId: string
  subject: string
  status: string
  priority: string
  source: string
  type: string
  agent: string
  group: string
  createdTime: string
  dueByTime: string
  resolvedTime: string
  closedTime: string
  lastUpdateTime: string
  initialResponseTime: string
  timeTracked: string
  firstResponseTimeHrs: string
  resolutionTimeHrs: string
  agentInteractions: string
  customerInteractions: string
  resolutionStatus: string
  firstResponseStatus: string
  tags: string
  surveyResults: string
  associationType: string
  internalAgent: string
  internalGroup: string
  everyResponseStatus: string
  product: string
  clientPriority: string
  clientReference: string
  numberOfUsersAffected: string
  location: string
  environment: string
  productDup: string
  module: string
  fault: string
  sdmEscalation: string
  resolution: string
  jiraRef: string
  releaseVersion: string
  reviewForSla: string
  feedbackRating: string
  team: string
  workaroundInPlace: string
  els: string
  position: string
  fullName: string
  title: string
  email: string
  workPhone: string
  mobilePhone: string
  twitterId: string
  timeZone: string
  language: string
  tagsContact: string
  uniqueExternalId: string
  twitterVerifiedProfile: string
  twitterFollowerCount: string
  facebookId: string
  contactId: string
  hostedClient: string
  companyName: string
  companyDomains: string
  typeOfHhAgreement: string
  healthScore: string
  accountTier: string
  renewalDate: string
  industry: string
  trail: string
  suspensions: string
  permits: string
  tarantoVersion: string
  civicaVersion: string
  sdm: string
  contractCode: string
  serviceCredits: string
  withinSlaOverride: string
}

export function parseCSV(csvContent: string): TicketData[] {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  
  const tickets: TicketData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    if (values.length !== headers.length) continue
    
    const ticket: TicketData = {
      ticketId: values[0] || '',
      subject: values[1] || '',
      status: values[2] || '',
      priority: values[3] || '',
      source: values[4] || '',
      type: values[5] || '',
      agent: values[6] || '',
      group: values[7] || '',
      createdTime: values[8] || '',
      dueByTime: values[9] || '',
      resolvedTime: values[10] || '',
      closedTime: values[11] || '',
      lastUpdateTime: values[12] || '',
      initialResponseTime: values[13] || '',
      timeTracked: values[14] || '',
      firstResponseTimeHrs: values[15] || '',
      resolutionTimeHrs: values[16] || '',
      agentInteractions: values[17] || '',
      customerInteractions: values[18] || '',
      resolutionStatus: values[19] || '',
      firstResponseStatus: values[20] || '',
      tags: values[21] || '',
      surveyResults: values[22] || '',
      associationType: values[23] || '',
      internalAgent: values[24] || '',
      internalGroup: values[25] || '',
      everyResponseStatus: values[26] || '',
      product: values[27] || '',
      clientPriority: values[28] || '',
      clientReference: values[29] || '',
      numberOfUsersAffected: values[30] || '',
      location: values[31] || '',
      environment: values[32] || '',
      productDup: values[33] || '',
      module: values[34] || '',
      fault: values[35] || '',
      sdmEscalation: values[36] || '',
      resolution: values[37] || '',
      jiraRef: values[38] || '',
      releaseVersion: values[39] || '',
      reviewForSla: values[40] || '',
      feedbackRating: values[41] || '',
      team: values[42] || '',
      workaroundInPlace: values[43] || '',
      els: values[44] || '',
      position: values[45] || '',
      fullName: values[46] || '',
      title: values[47] || '',
      email: values[48] || '',
      workPhone: values[49] || '',
      mobilePhone: values[50] || '',
      twitterId: values[51] || '',
      timeZone: values[52] || '',
      language: values[53] || '',
      tagsContact: values[54] || '',
      uniqueExternalId: values[55] || '',
      twitterVerifiedProfile: values[56] || '',
      twitterFollowerCount: values[57] || '',
      facebookId: values[58] || '',
      contactId: values[59] || '',
      hostedClient: values[60] || '',
      companyName: values[61] || '',
      companyDomains: values[62] || '',
      typeOfHhAgreement: values[63] || '',
      healthScore: values[64] || '',
      accountTier: values[65] || '',
      renewalDate: values[66] || '',
      industry: values[67] || '',
      trail: values[68] || '',
      suspensions: values[69] || '',
      permits: values[70] || '',
      tarantoVersion: values[71] || '',
      civicaVersion: values[72] || '',
      sdm: values[73] || '',
      contractCode: values[74] || '',
      serviceCredits: values[75] || '',
      withinSlaOverride: values[76] || ''
    }
    
    tickets.push(ticket)
  }
  
  return tickets
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  result.push(current.trim())
  return result
}