import React from 'react';
import {
  Bot,
  GraduationCap,
  Briefcase,
  Store,
  HeartPulse,
  Languages,
  Wallet,
  Scale,
  Wrench,
  Siren,
  Home,
  Mic,
  Camera,
  Globe,
} from 'lucide-react';

export const HelpHubIcon: React.FC<{ slug: string; className?: string }> = ({
  slug,
  className = 'w-5 h-5',
}) => {
  switch (slug) {
    case 'assistant':
      return <Bot className={className} />;
    case 'student':
      return <GraduationCap className={className} />;
    case 'jobs':
      return <Briefcase className={className} />;
    case 'business':
      return <Store className={className} />;
    case 'health':
      return <HeartPulse className={className} />;
    case 'translate':
      return <Languages className={className} />;
    case 'money':
      return <Wallet className={className} />;
    case 'legal':
      return <Scale className={className} />;
    case 'tech':
      return <Wrench className={className} />;
    case 'emergency':
      return <Siren className={className} />;
    case 'daily':
      return <Home className={className} />;
    case 'voice':
      return <Mic className={className} />;
    case 'image':
      return <Camera className={className} />;
    case 'languages':
      return <Globe className={className} />;
    default:
      return <Bot className={className} />;
  }
};
