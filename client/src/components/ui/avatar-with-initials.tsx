import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AvatarWithInitialsProps {
  name: string;
  className?: string;
}

export function AvatarWithInitials({ name, className = "" }: AvatarWithInitialsProps) {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-primary-100 text-primary-700 font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
