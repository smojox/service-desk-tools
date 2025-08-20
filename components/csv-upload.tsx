"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { parseCSV, TicketData } from "@/lib/csv-parser"

interface CSVUploadProps {
  onDataUpload: (tickets: TicketData[]) => void
  className?: string
}

export function CSVUpload({ onDataUpload, className }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const text = await file.text()
      const tickets = parseCSV(text)
      
      if (tickets.length === 0) {
        setError('No valid ticket data found in the CSV file')
        return
      }

      onDataUpload(tickets)
    } catch (err) {
      setError('Error parsing CSV file. Please check the format.')
      console.error('CSV parsing error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Upload CSV File
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your CSV file here, or click to browse
        </p>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mb-4"
        >
          {isUploading ? 'Processing...' : 'Choose File'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <X className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}