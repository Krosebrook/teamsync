import React, { useState } from 'react';
import { ArrowRight, Zap, Shield, Briefcase, Users, TrendingUp, ChevronDown } from 'lucide-react';

export default function INTBrandShowcase() {
  const [activeTab, setActiveTab] = useState('services');

  const services = [
    { id: 1, name: 'Information Security', icon: Shield, description: 'Cyberattacks? Not on our watch. We strengthen your security posture.' },
    { id: 2, name: 'Technology Solutions', icon: Zap, description: 'Expert IT support, network security, and data insights for your business.' },
    { id: 3, name: 'Web & Creative', icon: Briefcase, description: 'Stunning websites and brand experiences that capture attention.' },
    { id: 4, name: 'Strategic Consulting', icon: Users, description: 'Partnership-driven solutions tailored to your unique challenges.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">•</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">INT</h1>
                <p className="text-xs text-orange-400">The Dot Studio</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {['Services', 'About', 'Work', 'Contact'].map(item => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-slate-300 hover:text-orange-400 transition-colors"
                >
                  {item}
                </a>
              ))}
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-40 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider">Studio Excellence</p>
                <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  You <span className="text-orange-500">Can</span> Take <span className="text-teal-400">for</span> Granted
                </h2>
              </div>

              <p className="text-lg text-slate-300 leading-relaxed max-w-lg">
                Partner with INT for innovative solutions tailored to your business. From security to strategy, we live in the details so you can focus on growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="group px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/50">
                  Explore Services
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-3 border border-slate-600 hover:border-teal-400 text-slate-300 hover:text-teal-400 rounded-lg font-semibold transition-colors">
                  Learn About Us
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { label: 'Services', value: '8+' },
                  { label: 'Partners', value: '50+' },
                  { label: 'Success Rate', value: '98%' }
                ].map((stat, idx) => (
                  <div key={idx} className="border-l border-teal-400/30 pl-4">
                    <p className="text-2xl font-bold text-orange-400">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Animated Dot Hero */}
            <div className="relative h-96 hidden md:flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 border-2 border-orange-500/30 rounded-full"></div>
                <div className="absolute inset-12 border border-teal-400/30 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-2xl shadow-orange-500/50 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">•</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-slate-800/50 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-4">Our Expertise</p>
            <h3 className="text-4xl font-bold text-white">What We Do Best</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="group relative p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 hover:border-orange-500/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-transparent to-teal-500/0 group-hover:from-orange-500/5 group-hover:to-teal-500/5 rounded-xl transition-all duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-teal-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-orange-500/40 group-hover:to-teal-500/40 transition-all">
                      <Icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">{service.name}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{service.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-orange-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn More <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-4">Our Approach</p>
            <h3 className="text-4xl font-bold text-white">From Dot to Excellence</h3>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Understand', desc: 'We deeply understand your vision' },
              { step: 2, title: 'Strategy', desc: 'Craft tailored strategic solutions' },
              { step: 3, title: 'Execute', desc: 'Seamless implementation & delivery' },
              { step: 4, title: 'Grow', desc: 'Continuous optimization & support' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[40%] h-1 bg-gradient-to-r from-orange-500/50 to-orange-500/0"></div>
                )}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-orange-500/50">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white text-center mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-400 text-center">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-teal-500/20"></div>
        </div>
        
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">Ready to Grow Your Business?</h3>
          <p className="text-lg text-slate-300 mb-8">
            Partner with INT and discover how thoughtful solutions can transform your operations.
          </p>
          <button className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold text-lg transition-all shadow-xl hover:shadow-orange-500/50">
            Schedule a Consultation
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {[
              { title: 'Services', links: ['Security', 'Technology', 'Web Design', 'Marketing'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Accreditations'] },
              { title: 'Resources', links: ['Case Studies', 'Templates', 'Guides', 'Webinars'] },
              { title: 'Contact', links: ['(847) 215-4900', 'info@intinc.com', 'LinkedIn', 'Twitter'] }
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a href="#" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-700/50 pt-8 flex items-center justify-between">
            <p className="text-sm text-slate-400">© 2025 INT. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {['Privacy', 'Terms', 'Cookies'].map((item, idx) => (
                <a key={idx} href="#" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}