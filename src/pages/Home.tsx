import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  MapPin, 
  Phone, 
  CheckCircle2,
  GraduationCap,
  Heart,
  Clock,
  FileText,
  Send,
  MessageCircle,
  ExternalLink,
  X,
  Bell,
  MessageSquare,
  Share2,
  Copy
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

const facilities = [
  "Spacious clean & Ventilated classrooms",
  "Kids Activity & Play Area",
  "Indoor Activities",
  "CCTV Enabled Campus",
  "Regular Health & Hygiene Awareness Programs",
  "Deeniyat Education (with certified Aalims)",
  "Moral Classes"
];

const classes = [
  "Pre-Nursery", "Nursery", "Junior KG", "Senior KG", "Classes I to VIII"
];

const feeStructure = [
  { group: "Group I (P.G.)", monthly: 350, yearly: 3850, exam: 450, total: 4300 },
  { group: "Group II (Class 1-3)", monthly: 400, yearly: 4400, exam: 600, total: 5000 },
  { group: "Group III (Class 4 & 5)", monthly: 450, yearly: 4950, exam: 600, total: 5550 },
  { group: "Group IV (Class 6, 7 & 8)", monthly: 500, yearly: 5500, exam: 750, total: 6250 },
];

export default function Home() {
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [contactForm, setContactForm] = useState({ parentName: '', mobile: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);
  const [inquiryForm, setInquiryForm] = useState({
    studentName: '',
    dob: '',
    currentClass: '',
    applyingFor: 'Nursery',
    fatherName: '',
    motherName: '',
    village: '',
    mobile1: '',
    mobile2: '',
    address: '',
    aadharNumber: '',
    amountPaid: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10));
    return onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'activities'), 
      where('title', '==', 'New Admission!'),
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    return onSnapshot(q, (snapshot) => {
      setAdmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admissions error:", error);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('timestamp', 'desc'), limit(5));
    return onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(12));
    return onSnapshot(q, (snapshot) => {
      setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...contactForm,
        status: 'unread',
        timestamp: Timestamp.now()
      });
      toast.success('Message sent successfully! Our team will reach out to you.');
      setContactForm({ parentName: '', mobile: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...inquiryForm,
        amountPaid: Number(inquiryForm.amountPaid) || 0,
        timestamp: Timestamp.now(),
        status: 'new'
      });
      toast.success('Inquiry submitted successfully! We will contact you soon.');
      setShowInquiryModal(false);
      setInquiryForm({
        studentName: '', dob: '', currentClass: '', applyingFor: 'Nursery',
        fatherName: '', motherName: '', village: '', mobile1: '', mobile2: '',
        address: '', aadharNumber: '', amountPaid: ''
      });
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'E.V.S. PUBLIC SCHOOL',
      text: 'Check out E.V.S. Public School - A Centre of Holistic Development with Education & Values. Admission Open 2026-27!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        console.log('Share failed or cancelled');
      }
    } else {
      setShowShareModal(true);
    }
  };
  return (
    <div className="flex flex-col">
      {/* Scrollable Admission Alert */}
      {admissions.length > 0 && (
        <div className="bg-red-600 text-white py-2 overflow-hidden whitespace-nowrap z-[100] border-b border-red-500 shadow-sm">
          <div className="flex animate-marquee-fast hover:pause items-center gap-12">
            {[...admissions, ...admissions].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                  New Admission: {a.description.split('welcome ')[1]?.split(' to')[0] || a.description} confirmed in {a.class}!
                </span>
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Share Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleShare}
        className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white p-4 rounded-full shadow-2xl border border-stone-800 flex items-center justify-center group"
      >
        <Share2 className="w-6 h-6 group-hover:text-red-500 transition-colors" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 font-bold text-sm">
          Share App
        </span>
      </motion.button>

      {/* Share Modal for non-supporting browsers */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowShareModal(false)}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full text-center"
          >
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full hover:bg-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Share With Friends</h3>
            <p className="text-stone-500 text-sm mb-8">Spread the word about E.V.S. Public School</p>
            
            <div className="space-y-3">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`Check out E.V.S. Public School - Admission Open 2026-27! ${window.location.origin}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success('Link copied!');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all"
              >
                <Copy className="w-5 h-5" />
                Copy Link
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://storage.googleapis.com/test-api-41230844307-vcm-prod.appspot.com/vcm-uploads/ais-dev-4bso5gphw72vhybmohveho-41230844307/1744434936306-0.png" 
            alt="EVS Public School Building" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/50" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-white uppercase bg-red-600 rounded-full">
              Admission Open 2026-27
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              E.V.S. PUBLIC SCHOOL
            </h1>
            <p className="text-xl md:text-2xl text-stone-200 mb-8 font-light italic">
              "A Centre of Holistic Development with Education & Values"
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setShowInquiryModal(true)}
                className="bg-white text-stone-900 px-8 py-4 rounded-full font-bold hover:bg-stone-100 transition-all active:scale-95 shadow-lg"
              >
                Inquiry Now
              </button>
              <a 
                href="#about" 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowInquiryModal(false)}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors z-20"
            >
              <X className="w-6 h-6 text-stone-900" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="lg:col-span-2 bg-stone-900 p-12 text-white flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Admission Inquiry</h2>
                  <p className="text-stone-400 mb-8 leading-relaxed">
                    Join E.V.S. Public School for a journey of excellence and values. Fill the form to get started.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 font-bold uppercase">Call Us</p>
                        <p className="font-bold">+91-8954555074</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12">
                  <img 
                    src="https://picsum.photos/seed/edu/400/300" 
                    alt="Education" 
                    className="rounded-2xl opacity-50 grayscale"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="lg:col-span-3 p-8 md:p-12">
                <form onSubmit={handleInquirySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Student's Name</label>
                    <input
                      required
                      type="text"
                      value={inquiryForm.studentName ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, studentName: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Date of Birth</label>
                    <input
                      type="date"
                      value={inquiryForm.dob ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, dob: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Current Class</label>
                    <input
                      type="text"
                      value={inquiryForm.currentClass ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, currentClass: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="e.g. Nursery"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Applying For</label>
                    <select
                      value={inquiryForm.applyingFor ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, applyingFor: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    >
                      <option>Pre-Nursery</option>
                      <option>Nursery</option>
                      <option>Junior KG</option>
                      <option>Senior KG</option>
                      {Array.from({length: 8}, (_, i) => (
                        <option key={i+1}>Class {i+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Father's Name</label>
                    <input
                      type="text"
                      value={inquiryForm.fatherName ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, fatherName: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Village / Area</label>
                    <input
                      required
                      type="text"
                      value={inquiryForm.village ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, village: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="e.g. Rampur"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-stone-700">Mobile Number</label>
                    <input
                      required
                      type="tel"
                      value={inquiryForm.mobile1 ?? ''}
                      onChange={e => setInquiryForm({...inquiryForm, mobile1: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="md:col-span-2 pt-4">
                    <button
                      disabled={inquiryLoading}
                      type="submit"
                      className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {inquiryLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Inquiry
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Fee Structure Section */}
      <section id="fees" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Fee Structure: Session 2026-27</h2>
            <p className="text-stone-600 font-medium">Admission Fee: ₹1,000 (One-time)</p>
            <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full mt-4" />
          </div>

          <div className="overflow-x-auto bg-white rounded-3xl shadow-xl border border-stone-200">
            <table className="w-full text-left">
              <thead className="bg-stone-900 text-white">
                <tr>
                  <th className="px-6 py-4 font-bold">Class / Group</th>
                  <th className="px-6 py-4 font-bold text-center">Monthly Fee (₹)</th>
                  <th className="px-6 py-4 font-bold text-center">Yearly Tuition (x11) (₹)</th>
                  <th className="px-6 py-4 font-bold text-center">Exam Fee (Yearly) (₹)</th>
                  <th className="px-6 py-4 font-bold text-center">Total Academic (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {feeStructure.map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-800">{row.group}</td>
                    <td className="px-6 py-4 text-center text-stone-600">₹{row.monthly}</td>
                    <td className="px-6 py-4 text-center text-stone-600">₹{row.yearly}</td>
                    <td className="px-6 py-4 text-center text-stone-600">₹{row.exam}</td>
                    <td className="px-6 py-4 text-center font-bold text-stone-900 bg-stone-50/50">₹{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-stone-500 text-sm italic">
            *Note: The yearly total is calculated for 11 months. The Exam Fee covers 3 major exams held during the academic session.
          </p>
        </div>
      </section>

      {/* Notice Board */}
      {notices.length > 0 && (
        <section className="bg-red-600 py-4 overflow-hidden relative z-20">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex-shrink-0 animate-pulse">
              <Bell className="w-3.5 h-3.5" />
              Latest Notices
            </div>
            <div className="flex gap-12 animate-marquee whitespace-nowrap">
              {notices.map((notice, i) => (
                <div key={i} className="flex items-center gap-4 text-white font-medium">
                  <span className="opacity-50">•</span>
                  <span>{notice.title}: {notice.content}</span>
                </div>
              ))}
              {/* Duplicate for seamless loop */}
              {notices.map((notice, i) => (
                <div key={`dup-${i}`} className="flex items-center gap-4 text-white font-medium">
                  <span className="opacity-50">•</span>
                  <span>{notice.title}: {notice.content}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Why Choose EVS Public School?</h2>
            <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Deeniyat Classes", desc: "Masnoon duas & Quranic education with certified Aalims.", img: "https://images.unsplash.com/photo-1597933534024-bc660333d288?auto=format&fit=crop&q=40&w=400" },
              { icon: ShieldCheck, title: "Safe & Secure", desc: "CCTV enabled campus with a focus on child safety.", img: "https://images.unsplash.com/photo-1558002038-1037906d8594?auto=format&fit=crop&q=40&w=400" },
              { icon: Users, title: "Trained Teachers", desc: "Dedicated and caring educators for every child.", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=40&w=400" },
              { icon: Sparkles, title: "Modern Learning", desc: "Smart classrooms and joyful activity-based learning methods.", img: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=40&w=400" },
              { icon: Heart, title: "Values & Discipline", desc: "Equal focus on character building and academic excellence.", img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=40&w=400" },
              { icon: GraduationCap, title: "English Medium", desc: "Strong foundation in English communication and personality development.", img: "https://images.unsplash.com/photo-1497633762265-9d179a990ec6?auto=format&fit=crop&q=40&w=400" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group bg-stone-50 rounded-[40px] border border-stone-100 hover:shadow-2xl transition-all overflow-hidden"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <item.icon className="w-5 h-5 text-stone-900" />
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-3 text-stone-900">{item.title}</h3>
                  <p className="text-stone-600 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities & Classes */}
      <section className="py-24 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Sparkles className="text-red-500" /> Our Facilities
              </h2>
              <ul className="space-y-4">
                {facilities.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-300">
                    <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-stone-800 p-10 rounded-[40px] border border-stone-700">
              <h2 className="text-3xl font-bold mb-8">Classes Offered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map((c, i) => (
                  <div key={i} className="bg-stone-700/50 p-4 rounded-2xl border border-stone-600 flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="font-medium">{c}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-6 bg-red-600/10 border border-red-600/20 rounded-2xl">
                <p className="text-red-400 font-bold text-sm uppercase tracking-wider mb-2">Principal</p>
                <p className="text-xl font-bold">Mujahir Sir</p>
                <p className="text-stone-400">+91-9720353137</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activities Section */}
      {activities.length > 0 && (
        <section className="py-24 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">School Activities</h2>
              <p className="text-stone-600">Stay updated with our latest classroom happenings</p>
              <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activities.map((activity) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-[32px] shadow-lg border border-stone-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-stone-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {activity.class}
                    </span>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">
                      {formatDate(activity.timestamp?.toDate())}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-stone-900">{activity.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-3">{activity.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-24 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-stone-900 tracking-tighter mb-4">LATEST EVENTS</h2>
              <p className="text-stone-500 font-bold uppercase tracking-[0.3em] text-xs">Capturing memories at EVS Public School</p>
              <div className="w-24 h-2 bg-red-600 mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {gallery.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative h-80 rounded-[40px] overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                >
                  <img 
                    src={item.url} 
                    alt={item.caption} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                    <p className="text-white text-sm font-bold leading-tight">{item.caption}</p>
                    <div className="w-8 h-1 bg-red-600 rounded-full mt-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="admission" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-50 rounded-[50px] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-stone-100">
            <div className="lg:w-1/2 p-12 lg:p-20">
              <h2 className="text-4xl font-bold mb-6">Contact Us</h2>
              <p className="text-stone-600 mb-10 text-lg">Visit our campus or reach out via WhatsApp for immediate assistance.</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Location</h4>
                    <a 
                      href="https://share.google/IbqNVP3pnIKlyBDfg" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-stone-600 hover:text-red-600 transition-colors"
                    >
                      Near Petrol Pump Saharanpur Road Chilkana
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Manager Contact</h4>
                    <p className="text-stone-600">Dr. Mh Salik</p>
                    <p className="text-stone-900 font-bold text-xl">+91-8954555074</p>
                  </div>
                </div>
                
                <div className="pt-6">
                  <a 
                    href="https://wa.me/918954555074" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 p-12 lg:p-20 bg-white border-l border-stone-100">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <MessageSquare className="text-red-600" />
                  Send us a Message
                </h3>
                <p className="text-stone-500 text-sm">Parents & visitors can direct messages to the school office.</p>
              </div>
              
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Your Name</label>
                    <input
                      required
                      type="text"
                      value={contactForm.parentName ?? ''}
                      onChange={e => setContactForm({...contactForm, parentName: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-stone-300"
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Mobile Number</label>
                    <input
                      required
                      type="tel"
                      value={contactForm.mobile ?? ''}
                      onChange={e => setContactForm({...contactForm, mobile: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-stone-300"
                      placeholder="Enter mobile"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    value={contactForm.message ?? ''}
                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none transition-all h-32 resize-none placeholder:text-stone-300"
                    placeholder="Write your message here..."
                  />
                </div>
                <button
                  disabled={contactLoading}
                  type="submit"
                  className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {contactLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 bg-stone-50 rounded-[50px] overflow-hidden shadow-2xl h-[400px] relative border border-stone-100">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.8694898517!2d77.4646875!3d30.0821875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ee95555555555%3A0x5555555555555555!2sEVS%20PUBLIC%20SCHOOL!5e0!3m2!1sen!2sin!4v1712912345678!5m2!1sen!2sin" 
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute bottom-6 right-6">
              <a 
                href="https://share.google/IbqNVP3pnIKlyBDfg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-stone-900 px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 hover:bg-stone-50 transition-all active:scale-95 border border-stone-100"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section / Share Prompt */}
      <section className="py-24 bg-red-600 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Help us grow our school community</h2>
            <p className="text-red-100 text-xl mb-10 max-w-2xl mx-auto font-medium">
              Share this portal with your friends and family to help them discover quality education with values.
            </p>
            <button 
              onClick={handleShare}
              className="bg-white text-red-600 px-12 py-5 rounded-full font-black text-lg hover:bg-stone-100 transition-all shadow-2xl active:scale-95 flex items-center gap-3 mx-auto"
            >
              <Share2 className="w-6 h-6" />
              Share App Link
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-500 text-sm">
            © 2024 E.V.S. Public School. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
