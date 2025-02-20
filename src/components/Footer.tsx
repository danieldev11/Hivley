import React from 'react';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import type { NavItem, SocialLink } from '../types';

const navigation: NavItem[] = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' }
];

const socialLinks: SocialLink[] = [
  { platform: 'Facebook', href: '#', icon: Facebook },
  { platform: 'Twitter', href: '#', icon: Twitter },
  { platform: 'Instagram', href: '#', icon: Instagram },
  { platform: 'Email', href: 'mailto:contact@hivley.com', icon: Mail }
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Hivley</h3>
            <p className="text-gray-400">
              Hively connects students for peer-to-peer services, making it easy to find and offer help within the campus community.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navigation.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                  aria-label={social.platform}
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition-colors duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Hivley. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};