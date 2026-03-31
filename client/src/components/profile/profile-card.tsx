import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { Edit, User as UserIcon, Phone, Mail, Calendar, Building } from "lucide-react";

interface ProfileCardProps {
  user: User;
  onEdit?: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  const { t } = useLanguage();

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return dateString;
    }
  };

  // Get the initials from the user's name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="border-white/10 shadow-premium overflow-hidden bg-[#0B0F1A] transition-all duration-300">
      <CardHeader className="relative pb-8 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent">
        <div className="absolute top-8 right-8">
          <Badge variant="outline" className="font-black capitalize bg-white/5 border-primary/20 text-primary shadow-sm h-8 px-4">
            {user.role}
          </Badge>
        </div>
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[20px] -z-10"></div>
            <Avatar className="h-24 w-24 border-2 border-background shadow-xl">
              <AvatarImage
                src={user.avatarUrl || ""}
                alt={user.fullName || ""}
              />
              <AvatarFallback className="text-xl">
                {getInitials(user.fullName || "")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-3xl font-black tracking-tighter">{user.fullName}</CardTitle>
            <CardDescription className="font-bold text-white/40">
              {t('profile.joinedOn', { date: formatDate(user.createdAt) })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {t('profile.username')}
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{user.username}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {t('profile.email')}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {t('profile.phone')}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phoneNumber || t('profile.notProvided')}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {t('profile.memberSince')}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        {onEdit && (
          <Button variant="outline" onClick={onEdit} className="h-14 w-full md:w-auto flex items-center justify-center gap-3 rounded-2xl border-white/10 bg-white/5 font-black text-white hover:bg-white/10 transition-all">
            <Edit className="h-5 w-5 text-primary" />
            {t('profile.editProfile')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}