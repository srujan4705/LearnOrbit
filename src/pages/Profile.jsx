import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Save, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await base44.auth.updateProfile(fullName);
      
      // Update auth context user
      setUser(updatedUser);
      
      toast({ title: "Profile updated!", description: "Your name has been changed successfully." });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information</p>
      </div>

      <Card className="hover-lift animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="pl-12 h-12 bg-muted cursor-not-allowed opacity-70"
              />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm">Full Name</Label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" aria-hidden="true" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="pl-12 h-12"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
