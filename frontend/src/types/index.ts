export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: React.ComponentType;
}