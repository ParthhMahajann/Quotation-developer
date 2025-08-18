"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar } from "lucide-react"

interface UserProfileProps {
  user: {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || "")

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "director":
        return "bg-purple-100 text-purple-800"
      case "senior_manager":
        return "bg-blue-100 text-blue-800"
      case "manager":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          User Profile
        </CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">Email:</span>
          <span className="text-sm text-gray-600">{user.email}</span>
        </div>

        <div className="flex items-center space-x-3">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">Full Name:</span>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-8 text-sm" />
              <Button size="sm" onClick={() => setIsEditing(false)}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{user.full_name || "Not set"}</span>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">Role:</span>
          <Badge className={getRoleBadgeColor(user.role)}>{user.role.replace("_", " ").toUpperCase()}</Badge>
        </div>

        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">Member since:</span>
          <span className="text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
