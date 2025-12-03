import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import auroraLogo from "@/assets/aurora-logo-white.png";
const footerLinks = {
  company: [{
    name: "About Us",
    path: "/about"
  }, {
    name: "Contact",
    path: "/contact"
  }, {
    name: "FAQ",
    path: "/faq"
  }],
  fundraising: [{
    name: "How It Works",
    path: "/fundraising"
  }, {
    name: "Resources",
    path: "/resources"
  }, {
    name: "Start Fundraising",
    path: "/contact"
  }],
  legal: [{
    name: "Privacy Policy",
    path: "/privacy"
  }, {
    name: "Terms & Conditions",
    path: "/terms"
  }]
};
export function Footer() {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={auroraLogo} alt="Aurora Fundraising" className="h-12 w-auto" />
              <span className="font-bold text-2xl">Aurora Fundraising</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6 max-w-sm">
              Empowering communities through impactful fundraising. We make it easy for organizations 
              to raise funds while providing real value to supporters.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
              <a href="#" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => <li key={link.path}>
                  <Link to={link.path} className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Fundraising Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Fundraising</h4>
            <ul className="space-y-3">
              {footerLinks.fundraising.map(link => <li key={link.path}>
                  <Link to={link.path} className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a className="flex items-center gap-2 text-primary-foreground/70 hover:text-secondary transition-colors text-sm" href="mailto:impactfulfundraising@gmail.com">
                  <Mail size={16} />
                  impactfulfundraising@gmail.com
                </a>
              </li>
              <li>
                <a className="flex items-center gap-2 text-primary-foreground/70 hover:text-secondary transition-colors text-sm" href="tel:+9073108288">
                  <Phone size={16} />
                  (907) 310-8288
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Aurora Fundraising. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map(link => <Link key={link.path} to={link.path} className="text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors text-sm">
                {link.name}
              </Link>)}
          </div>
        </div>
      </div>
    </footer>;
}