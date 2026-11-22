import React from 'react';
import {
  Image as ImageIcon,
  Shapes,
  FileText,
  BookOpen,
  SlidersHorizontal,
  Eraser,
  Film,
  Mic,
  Code2,
  MessageSquare,
  FileUser,
  Languages,
  LayoutTemplate,
  Building2,
  Share2,
} from 'lucide-react';

export const ToolIcon: React.FC<{ slug: string; className?: string }> = ({
  slug,
  className = 'w-5 h-5',
}) => {
  switch (slug) {
    case 'image-generator':
      return <ImageIcon className={className} />;
    case 'logo-maker':
      return <Shapes className={className} />;
    case 'text-generator':
      return <FileText className={className} />;
    case 'story-writer':
      return <BookOpen className={className} />;
    case 'photo-editor':
      return <SlidersHorizontal className={className} />;
    case 'background-remover':
      return <Eraser className={className} />;
    case 'video-generator':
      return <Film className={className} />;
    case 'voice-generator':
      return <Mic className={className} />;
    case 'code-generator':
      return <Code2 className={className} />;
    case 'chatbot':
      return <MessageSquare className={className} />;
    case 'resume-builder':
      return <FileUser className={className} />;
    case 'translator':
      return <Languages className={className} />;
    case 'thumbnail-maker':
      return <LayoutTemplate className={className} />;
    case 'business-name-generator':
      return <Building2 className={className} />;
    case 'social-media-post-generator':
      return <Share2 className={className} />;
    default:
      return <ImageIcon className={className} />;
  }
};
