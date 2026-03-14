'use client'

import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface SearchAndFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  fileTypeFilter: string
  onFileTypeChange: (filter: string) => void
  statusFilter: string
  onStatusChange: (filter: string) => void
  certificateFilter: string
  onCertificateChange: (filter: string) => void
  timeFilter: string
  onTimeChange: (filter: string) => void
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  fileTypeFilter,
  onFileTypeChange,
  statusFilter,
  onStatusChange,
  certificateFilter,
  onCertificateChange,
  timeFilter,
  onTimeChange,
}: SearchAndFilterProps) {
  // Helper function to check if a filter is active
  const isFilterActive = (filter: string) => filter !== 'all'

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* File Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              File Type
              {isFilterActive(fileTypeFilter) && (
                <Badge
                  className="ml-2 bg-primary text-primary-foreground"
                  variant="default"
                >
                  1
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">File Type</h4>
              <RadioGroup
                value={fileTypeFilter}
                onValueChange={onFileTypeChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="file-all" />
                  <Label htmlFor="file-all">All file types</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image/" id="file-image" />
                  <Label htmlFor="file-image">Images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="application/mp4" id="file-video" />
                  <Label htmlFor="file-video">Videos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="audio/" id="file-audio" />
                  <Label htmlFor="file-audio">Audio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="application/" id="file-doc" />
                  <Label htmlFor="file-doc">Documents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text/" id="file-text" />
                  <Label htmlFor="file-text">Text</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Filter Inactive*/}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Status
              {isFilterActive(statusFilter) && (
                <Badge
                  className="ml-2 bg-primary text-primary-foreground"
                  variant="default"
                >
                  1
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Status</h4>
              <RadioGroup value={statusFilter} onValueChange={onStatusChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="status-all" />
                  <Label htmlFor="status-all">All statuses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="status-active" />
                  <Label htmlFor="status-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="status-inactive" />
                  <Label htmlFor="status-inactive">Inactive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pending" id="status-pending" />
                  <Label htmlFor="status-pending">Pending</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover> */}

        {/* Certificate Filter Inactive*/}
        {/* <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Criteria
              {isFilterActive(certificateFilter) && (
                <Badge
                  className="ml-2 bg-primary text-primary-foreground"
                  variant="default"
                >
                  1
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Criteria</h4>
              <RadioGroup
                value={certificateFilter}
                onValueChange={onCertificateChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="cert-all" />
                  <Label htmlFor="cert-all">All certificates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="certified" id="cert-yes" />
                  <Label htmlFor="cert-yes">Certified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-certified" id="cert-no" />
                  <Label htmlFor="cert-no">Not Certified</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover> */}

        {/* Uploaded Time Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Uploaded Time
              {isFilterActive(timeFilter) && (
                <Badge
                  className="ml-2 bg-primary text-primary-foreground"
                  variant="default"
                >
                  1
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Uploaded Time</h4>
              <RadioGroup value={timeFilter} onValueChange={onTimeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="time-all" />
                  <Label htmlFor="time-all">Any time</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="today" id="time-today" />
                  <Label htmlFor="time-today">Today</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="this-week" id="time-week" />
                  <Label htmlFor="time-week">This week</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="this-month" id="time-month" />
                  <Label htmlFor="time-month">This month</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="older" id="time-older" />
                  <Label htmlFor="time-older">Older</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
