import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User } from "@shared/schema"; // Import User type
import { Edit, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";

interface ProfileCardProps {
  user: User;
  onEdit: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  const { t } = useTranslation();

  // Helper function to generate initials from user's name
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 text-center md:text-left flex-1">
            <CardTitle className="text-2xl">{user.fullName}</CardTitle>
            <div className="text-muted-foreground">{user.username}</div>
            <div className="flex items-center justify-center md:justify-start mt-2 gap-2">
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t("profile.memberSince")} {formatDate(user.createdAt)}
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit} 
            className="hidden md:flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t("profile.editProfile")}
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("profile.contactInfo")}
              </h3>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email || t("common.notProvided")}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phoneNumber || t("common.notProvided")}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("profile.accountInfo")}
              </h3>
              
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span>{t("profile.role")}: {user.role}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{t("profile.memberSince")}: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="md:hidden">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit} 
          className="w-full flex items-center gap-2 justify-center"
        >
          <Edit className="h-4 w-4" />
          {t("profile.editProfile")}
        </Button>
      </CardFooter>
    </Card>
  );
}