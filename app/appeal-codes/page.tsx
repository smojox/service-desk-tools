"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Download, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// Notice Types mapping
const NOTICE_TYPES = {
  1: "Parking",
  2: "Being in a bus lane",
  3: "RUCA (Road User Charging – Dart Charge, Durham, Merseyflow)",
  4: "Moving Traffic",
  5: "Spare",
  6: "Clean Air Zones",
  7: "Littering from Vehicles",
  8: "Clamp",
  9: "Remove",
  0: "Spare"
} as const

// Appeal code generation and validation logic
class AppealCodeService {
  static generateAppealCode(date: Date, noticeType: keyof typeof NOTICE_TYPES): string {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    
    // Step 1: Subtract first two digits of date from 100
    const firstTwoDigits = Math.floor(day / 10) * 10 + (day % 10)
    const step1 = 100 - firstTwoDigits
    
    // Step 2: Convert month to alpha character (Jan=A, Feb=B, etc)
    const monthChar = String.fromCharCode(65 + month - 1) // A=65
    
    // Step 3: Take last digit from year
    const yearDigit = year % 10
    
    // Step 4: Notice type number
    const noticeTypeNum = noticeType
    
    // Create base code
    const baseCode = `${step1}${monthChar}${yearDigit}${noticeTypeNum}`
    
    // Step 5: Calculate check digit
    const checkDigit = this.calculateCheckDigit(step1, monthChar, yearDigit, noticeTypeNum)
    
    return `${baseCode}${checkDigit}`
  }
  
  private static calculateCheckDigit(num1: number, monthChar: string, yearDigit: number, noticeType: number): string {
    // Convert alpha character to number
    const charCode = monthChar.charCodeAt(0) - 65 + 1 // A=1, B=2, etc
    let alphaNum: number
    
    if (charCode <= 10) { // A-J
      alphaNum = charCode === 10 ? 0 : charCode
    } else if (charCode <= 20) { // K-T
      alphaNum = (charCode - 10) === 10 ? 0 : (charCode - 10)
    } else { // U-Z
      alphaNum = charCode - 20
    }
    
    // Create the 5-digit number for calculation
    const digits = [
      Math.floor(num1 / 10),
      num1 % 10,
      alphaNum,
      yearDigit,
      noticeType
    ]
    
    // Calculate (a*5) + (b*4) + (c*3) + (d*2) + (e*1)
    const total = digits.reduce((sum, digit, index) => {
      return sum + (digit * (5 - index))
    }, 0)
    
    // Divide by 11 and get remainder
    const remainder = total % 11
    
    // If remainder is 10, return 'A', otherwise return the digit
    return remainder === 10 ? 'A' : remainder.toString()
  }
  
  static validateAppealCode(code: string): { isValid: boolean; date?: Date; noticeType?: string; details?: string } {
    if (!code || code.length !== 6) {
      return { isValid: false, details: "Code must be 6 characters long" }
    }
    
    try {
      // Parse the code
      const num1 = parseInt(code.substring(0, 2))
      const monthChar = code.charAt(2)
      const yearDigit = parseInt(code.charAt(3))
      const noticeTypeNum = parseInt(code.charAt(4)) as keyof typeof NOTICE_TYPES
      const checkDigit = code.charAt(5)
      
      // Validate components
      if (isNaN(num1) || isNaN(yearDigit) || isNaN(noticeTypeNum)) {
        return { isValid: false, details: "Invalid code format" }
      }
      
      if (!(noticeTypeNum in NOTICE_TYPES)) {
        return { isValid: false, details: "Invalid notice type" }
      }
      
      // Calculate expected check digit
      const expectedCheckDigit = this.calculateCheckDigit(num1, monthChar, yearDigit, noticeTypeNum)
      
      if (checkDigit !== expectedCheckDigit) {
        return { isValid: false, details: "Invalid check digit" }
      }
      
      // Reconstruct date
      const day = 100 - num1
      const month = monthChar.charCodeAt(0) - 64 // A=1, B=2, etc
      const currentYear = new Date().getFullYear()
      const decade = Math.floor(currentYear / 10) * 10
      const year = decade + yearDigit
      
      // Adjust year if needed (assume codes are from last 20 years)
      const adjustedYear = year > currentYear ? year - 10 : year
      
      const date = new Date(adjustedYear, month - 1, day)
      
      return {
        isValid: true,
        date,
        noticeType: NOTICE_TYPES[noticeTypeNum],
        details: `Valid code for ${date.toLocaleDateString('en-GB')} - ${NOTICE_TYPES[noticeTypeNum]}`
      }
    } catch (error) {
      return { isValid: false, details: "Error parsing code" }
    }
  }
  
  static generateCSVForDateRange(startDate: Date, endDate: Date): string {
    const codes: string[] = []
    codes.push("Date,Notice Type,Appeal Code") // CSV header
    
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // Generate codes for each notice type for this date
      Object.keys(NOTICE_TYPES).forEach(noticeType => {
        const code = this.generateAppealCode(currentDate, parseInt(noticeType) as keyof typeof NOTICE_TYPES)
        const dateStr = currentDate.toLocaleDateString('en-GB')
        const noticeDesc = NOTICE_TYPES[parseInt(noticeType) as keyof typeof NOTICE_TYPES]
        
        codes.push(`"${dateStr}","${noticeDesc}","${code}"`)
      })
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return codes.join('\n')
  }
}

export default function AppealCodesPage() {
  const router = useRouter()
  const [validateCode, setValidateCode] = useState("")
  const [validationResult, setValidationResult] = useState<any>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  
  const handleValidation = () => {
    const result = AppealCodeService.validateAppealCode(validateCode.toUpperCase())
    setValidationResult(result)
  }
  
  const handleExport = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates")
      return
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      alert("Start date must be before end date")
      return
    }
    
    setIsExporting(true)
    
    try {
      const csvContent = AppealCodeService.generateCSVForDateRange(start, end)
      
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `appeal-codes-${startDate}-to-${endDate}.csv`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert("Error generating CSV file")
    }
    
    setIsExporting(false)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/20"
                onClick={() => router.push('/tools')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools Hub
              </Button>
              <img 
                src="/logo.png" 
                alt="Taranto Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-gray-300">Appeal Codes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 text-2xl">Appeal Code Management</CardTitle>
              <p className="text-gray-600">Validate existing appeal codes or export codes for date ranges</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="validate" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="validate">Validate Code</TabsTrigger>
                  <TabsTrigger value="export">Export CSV</TabsTrigger>
                </TabsList>
                
                <TabsContent value="validate" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Code Validation</CardTitle>
                      <p className="text-sm text-gray-600">Enter an appeal code to validate and see its details</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="appeal-code">Appeal Code</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="appeal-code"
                            placeholder="Enter 6-character appeal code (e.g., 81G51A)"
                            value={validateCode}
                            onChange={(e) => setValidateCode(e.target.value)}
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button onClick={handleValidation} disabled={!validateCode}>
                            Validate
                          </Button>
                        </div>
                      </div>
                      
                      {validationResult && (
                        <div className={`p-4 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center space-x-2">
                            {validationResult.isValid ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`font-semibold ${validationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                              {validationResult.isValid ? 'Valid Code' : 'Invalid Code'}
                            </span>
                          </div>
                          <p className={`mt-2 ${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                            {validationResult.details}
                          </p>
                          {validationResult.isValid && validationResult.date && (
                            <div className="mt-3 space-y-1 text-sm text-green-700">
                              <p><strong>Date:</strong> {validationResult.date.toLocaleDateString('en-GB')}</p>
                              <p><strong>Notice Type:</strong> {validationResult.noticeType}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="export" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export Appeal Codes</CardTitle>
                      <p className="text-sm text-gray-600">Generate CSV file with all appeal codes for a date range</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Export Information</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          The CSV will include appeal codes for all notice types for each day in the selected range:
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1">
                          <li>• Type 0: {NOTICE_TYPES[0]}</li>
                          <li>• Type 1: {NOTICE_TYPES[1]}</li>
                          <li>• Type 2: {NOTICE_TYPES[2]}</li>
                          <li>• Type 3: {NOTICE_TYPES[3]}</li>
                          <li>• Type 4: {NOTICE_TYPES[4]}</li>
                          <li>• Type 5: {NOTICE_TYPES[5]}</li>
                          <li>• Type 6: {NOTICE_TYPES[6]}</li>
                          <li>• Type 7: {NOTICE_TYPES[7]}</li>
                          <li>• Type 8: {NOTICE_TYPES[8]}</li>
                          <li>• Type 9: {NOTICE_TYPES[9]}</li>
                        </ul>
                      </div>
                      
                      <Button 
                        onClick={handleExport}
                        disabled={!startDate || !endDate || isExporting}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Generating CSV...' : 'Export Appeal Codes CSV'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}