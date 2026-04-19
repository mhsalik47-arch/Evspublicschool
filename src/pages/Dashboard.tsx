import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  where,
  limit,
  getDoc,
  doc,
  updateDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Users, 
  Phone, 
  GraduationCap, 
  Calendar,
  Search,
  MessageSquare,
  Bell,
  CheckCircle2,
  ShieldAlert,
  FileText,
  ClipboardList,
  IndianRupee,
  Activity as ActivityIcon,
  Plus,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Inbox,
  LayoutDashboard,
  Settings as Cog,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Student {
  id: string;
  fullName: string;
  parentName: string;
  parentPhone: string;
  class: string;
  registeredBy: string;
  registeredByName: string;
  registrationDate: any;
  status: string;
}

export default function Dashboard() {
  const { user, role, userData } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'inquiries' | 'fees' | 'activities' | 'notices' | 'messages' | 'settings'>(role === 'admin' ? 'students' : 'students');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Profile Completion State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    designation: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    parentName: '',
    parentPhone: '',
    class: 'Nursery'
  });

  const [feeForm, setFeeForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    month: 'April',
    type: 'Monthly'
  });

  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    class: 'All Classes'
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });

  useEffect(() => {
    if (!user || !role) return;

    // Fetch Students
    let unsubStudents = () => {};
    const studentsBaseQ = collection(db, 'students');
    const studentsQ = role === 'admin' 
      ? query(studentsBaseQ, orderBy('registrationDate', 'desc'))
      : query(studentsBaseQ, where('registeredBy', '==', user.uid), orderBy('registrationDate', 'desc'));

    unsubStudents = onSnapshot(studentsQ, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
    }, (error) => {
      console.error('Students Snapshot Error:', error);
      if (!error.message.includes('permission')) {
        toast.error('Failed to load students');
      }
    });

    // Fetch Inquiries
    let unsubInquiries = () => {};
    if (role === 'admin') {
      const inquiriesQ = query(collection(db, 'inquiries'), orderBy('timestamp', 'desc'));
      unsubInquiries = onSnapshot(inquiriesQ, (snapshot) => {
        setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error('Inquiries Snapshot Error:', error);
      });
    } else if (role === 'staff') {
      const inquiriesQ = query(collection(db, 'inquiries'), where('assignedStaffId', '==', user.uid));
      unsubInquiries = onSnapshot(inquiriesQ, (snapshot) => {
        setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error('Inquiries Snapshot Error:', error);
      });
    }

    // Fetch Staff (Admin Only)
    let unsubStaff = () => {};
    if (role === 'admin') {
      const staffQ = query(collection(db, 'users'), where('role', '==', 'staff'));
      unsubStaff = onSnapshot(staffQ, (snapshot) => {
        setStaffMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    // Fetch Fees
    let unsubFees = () => {};
    const feesBaseQ = collection(db, 'fees');
    const feesQ = role === 'admin'
      ? query(feesBaseQ, orderBy('timestamp', 'desc'))
      : query(feesBaseQ, where('collectedBy', '==', user.uid), orderBy('timestamp', 'desc'));

    unsubFees = onSnapshot(feesQ, (snapshot) => {
      setFees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Fees Snapshot Error:', error);
    });

    // Fetch Activities
    const activitiesBaseQ = collection(db, 'activities');
    const activitiesQ = role === 'admin'
      ? query(activitiesBaseQ, orderBy('timestamp', 'desc'))
      : query(activitiesBaseQ, where('postedBy', '==', user.uid), orderBy('timestamp', 'desc'));

    const unsubActivities = onSnapshot(activitiesQ, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Activities Snapshot Error:', error);
    });

    // Fetch Notices
    const noticesBaseQ = collection(db, 'notices');
    const noticesQ = role === 'admin'
      ? query(noticesBaseQ, orderBy('timestamp', 'desc'))
      : query(noticesBaseQ, where('postedBy', '==', user.uid), orderBy('timestamp', 'desc'));

    const unsubNotices = onSnapshot(noticesQ, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error('Notices Snapshot Error:', error);
    });

    // Fetch Messages (Admin Only)
    let unsubMessages = () => {};
    if (role === 'admin') {
      const messagesQ = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
      unsubMessages = onSnapshot(messagesQ, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error('Messages Snapshot Error:', error);
      });
    }

    return () => {
      unsubStudents();
      unsubInquiries();
      unsubFees();
      unsubActivities();
      unsubNotices();
      unsubMessages();
      unsubStaff();
    };
  }, [user, role]);

  const sendWhatsAppNotification = (studentName: string, parentPhone: string, studentClass: string) => {
    const cleanPhone = parentPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = `*E.V.S. PUBLIC SCHOOL Admission Confirmation*\n\nDear Parent,\n\nWe are happy to inform you that your child *${studentName}* has been successfully registered in *${studentClass}* at E.V.S. Public School.\n\nThank you for choosing us for your child's holistic development.\n\nFor any queries, contact our official number: 8954555074\n\n_Regards,_\n*Manager, EVS Public School*`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'students'), {
        ...studentForm,
        registeredBy: user.uid,
        registeredByName: userData?.fullName || user.displayName || user.email || user.phoneNumber || 'Staff Member',
        registeredByDesignation: userData?.designation || '',
        registrationDate: Timestamp.now(),
        status: 'confirmed'
      });
      await addDoc(collection(db, 'notifications'), {
        type: 'registration',
        message: `New student ${studentForm.fullName} registered by ${userData?.fullName || user.displayName || user.phoneNumber}`,
        timestamp: Timestamp.now(),
        read: false
      });
      
      const registeredStudent = { ...studentForm };
      toast.success('Student registered successfully!', {
        action: {
          label: 'Send WhatsApp',
          onClick: () => sendWhatsAppNotification(registeredStudent.fullName, registeredStudent.parentPhone, registeredStudent.class)
        },
        duration: 10000
      });
      
      setStudentForm({ fullName: '', parentName: '', parentPhone: '', class: 'Nursery' });
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const selectedStudent = students.find(s => s.id === feeForm.studentId);
      await addDoc(collection(db, 'fees'), {
        ...feeForm,
        studentName: selectedStudent?.fullName || 'Unknown',
        amount: Number(feeForm.amount),
        collectedBy: user.uid,
        collectedByName: userData?.fullName || user.displayName || user.phoneNumber || 'Staff Member',
        collectedByDesignation: userData?.designation || '',
        timestamp: Timestamp.now()
      });
      await addDoc(collection(db, 'notifications'), {
        type: 'fee',
        message: `Fee of ₹${feeForm.amount} collected for ${selectedStudent?.fullName} by ${userData?.fullName || user.displayName || user.phoneNumber}`,
        timestamp: Timestamp.now(),
        read: false
      });
      toast.success('Fee recorded successfully!');
      setFeeForm({ studentId: '', studentName: '', amount: '', month: 'April', type: 'Monthly' });
    } catch (error: any) {
      toast.error('Failed to record fee');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: newStatus
      });
      toast.success(`Inquiry status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: profileForm.fullName,
        designation: profileForm.designation,
        displayName: profileForm.fullName // Also update displayName for consistency
      });
      toast.success('Profile updated successfully!');
      // Force reload or state update would be better, but re-fetching user data takes care of it
      window.location.reload(); 
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAssignInquiry = async (inquiryId: string, staffId: string) => {
    try {
      if (!staffId) {
        await updateDoc(doc(db, 'inquiries', inquiryId), {
          assignedStaffId: null,
          assignedStaffName: null
        });
        toast.success('Assignment removed');
        return;
      }
      const staff = staffMembers.find(s => s.uid === staffId);
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        assignedStaffId: staffId,
        assignedStaffName: staff?.fullName || staff?.displayName || staff?.email,
        assignedStaffDesignation: staff?.designation || ''
      });
      toast.success(`Inquiry assigned to ${staff?.fullName || staff?.displayName || staff?.email}`);
    } catch (error: any) {
      toast.error('Failed to assign inquiry');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'activities'), {
        ...activityForm,
        postedBy: user.uid,
        postedByName: user.displayName || user.phoneNumber,
        timestamp: Timestamp.now()
      });
      toast.success('Activity posted successfully!');
      setActivityForm({ title: '', description: '', class: 'All Classes' });
    } catch (error: any) {
      toast.error('Failed to post activity');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'notices'), {
        ...noticeForm,
        postedBy: user.uid,
        postedByName: user.displayName || user.phoneNumber,
        timestamp: Timestamp.now()
      });
      toast.success('Notice posted successfully!');
      setNoticeForm({ title: '', content: '', priority: 'normal' });
    } catch (error: any) {
      toast.error('Failed to post notice');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'students') {
      return students.filter(s => {
        const matchesSearch = s.fullName.toLowerCase().includes(term) || s.parentPhone.includes(term);
        const matchesClass = classFilter === 'All Classes' || s.class === classFilter;
        return matchesSearch && matchesClass;
      });
    }
    if (activeTab === 'inquiries') return inquiries.filter(i => i.studentName.toLowerCase().includes(term) || i.mobile1.includes(term));
    if (activeTab === 'fees') return fees.filter(f => f.studentName.toLowerCase().includes(term) || f.month.toLowerCase().includes(term));
    if (activeTab === 'activities') return activities.filter(a => a.title.toLowerCase().includes(term) || a.class.toLowerCase().includes(term));
    if (activeTab === 'notices') return notices.filter(n => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term));
    if (activeTab === 'messages') return messages.filter(m => m.parentName.toLowerCase().includes(term) || m.message.toLowerCase().includes(term));
    if (activeTab === 'settings') return [];
    return [];
  };

  const handleResetAppData = async () => {
    setLoading(true);
    try {
      const collections = ['students', 'fees', 'inquiries', 'messages', 'activities', 'notices', 'notifications'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let deletedCount = 0;

      for (const colName of collections) {
        try {
          const snapshot = await getDocs(collection(db, colName));
          const deletePromises = snapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            // Check various timestamp fields
            const docDate = data.timestamp?.toDate ? data.timestamp.toDate() : 
                          data.registrationDate?.toDate ? data.registrationDate.toDate() :
                          data.date?.toDate ? data.date.toDate() :
                          (data.createdAt ? new Date(data.createdAt) : null);
            
            if (!docDate || docDate < today) {
              await deleteDoc(docSnapshot.ref);
              deletedCount++;
            }
          });
          await Promise.all(deletePromises);
        } catch (colError) {
          console.warn(`Could not reset collection ${colName}:`, colError);
        }
      }
      toast.success(`Reset complete! Deleted ${deletedCount} old records.`);
      setIsResetModalOpen(false);
    } catch (error: any) {
      console.error('Reset Error:', error);
      toast.error('Unexpected error during reset: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (role !== 'admin') return;
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(5));
    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [role]);  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Completion Overlay */}
      {role === 'staff' && userData && (!userData.fullName || !userData.designation) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Complete Profile</h2>
              <p className="text-stone-500 text-sm mt-2 italic">Please provide your details to continue</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Full Name</label>
                <input
                  required
                  type="text"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all font-bold"
                  placeholder="e.g. Mohd Salik"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Designation / Post</label>
                <input
                  required
                  type="text"
                  value={profileForm.designation}
                  onChange={e => setProfileForm({...profileForm, designation: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all font-bold"
                  placeholder="e.g. Mathematics Teacher"
                />
              </div>
              <button
                disabled={profileLoading}
                type="submit"
                className="w-full bg-stone-900 text-white font-black py-5 rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
              >
                {profileLoading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Role Indicator */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">Dashboard</h1>
        </div>
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border shadow-sm ${role === 'admin' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
          {role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{role === 'admin' ? 'Manager Access' : 'Staff Access'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-3 shadow-xl shadow-stone-200/50 border border-stone-100">
            <nav className="space-y-1">
              {[
                { id: 'students', icon: Users, label: 'Students', count: students.length },
                { id: 'activities', icon: ActivityIcon, label: 'Activity Feed', count: activities.length },
                { id: 'notices', icon: Bell, label: 'Notice Board', count: notices.length },
                { id: 'fees', icon: IndianRupee, label: 'Accounts', count: fees.length },
                ...(role === 'admin' ? [
                  { id: 'inquiries', icon: ClipboardList, label: 'Admissions', count: inquiries.length },
                  { id: 'messages', icon: Inbox, label: 'Visitor Inbox', count: messages.length },
                  { id: 'settings', icon: Cog, label: 'System Settings', count: 0 }
                ] : [
                  { id: 'inquiries', icon: ClipboardList, label: 'Assigned Leads', count: inquiries.length }
                ])
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setShowAddForm(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20 translate-x-1' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-red-500' : ''}`} />
                    <span className="text-sm font-bold tracking-tight">{tab.label}</span>
                  </div>
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Manager Notification Insight */}
          {role === 'admin' && notifications.length > 0 && (
            <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-xl shadow-stone-900/20 border border-stone-800 relative overflow-hidden group">
              <Bell className="absolute -right-6 -bottom-6 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Insight</span>
                </div>
                <p className="text-xs font-medium text-stone-300 leading-relaxed mb-3">{notifications[0].message}</p>
                <p className="text-[10px] font-bold text-stone-500 uppercase">{formatDate(notifications[0].timestamp?.toDate())}</p>
              </div>
            </div>
          )}

          {/* User Profile Info Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-stone-200/50 border border-stone-100 mt-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 border border-stone-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-stone-900 tracking-tight leading-tight">
                  {userData?.fullName || userData?.displayName || 'User'}
                </h4>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-0.5">
                  {userData?.designation || (role === 'admin' ? 'Manager' : 'Staff Individual')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Action & Filter Header */}
          <div className="bg-white rounded-3xl p-4 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                />
              </div>
              {activeTab === 'students' && (
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-100 rounded-2xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-stone-900 outline-none transition-all cursor-pointer"
                >
                  <option>All Classes</option>
                  <option>Pre-Nursery</option>
                  <option>Nursery</option>
                  <option>Junior KG</option>
                  <option>Senior KG</option>
                  {Array.from({length: 8}, (_, i) => (
                    <option key={i+1}>Class {i+1}</option>
                  ))}
                </select>
              )}
            </div>

            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                showAddForm ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20'
              }`}
            >
              {showAddForm ? <LayoutDashboard className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'View List' : `Add ${activeTab === 'messages' ? 'Notice' : activeTab.slice(0, -1)}`}
            </button>
          </div>

          {/* Dynamic Content Overlay / Form */}
          {showAddForm && (
            <div className="bg-white rounded-[40px] shadow-2xl p-8 border-2 border-stone-900/5 transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">New {activeTab.slice(0, -1)}</h2>
                  <p className="text-stone-500 text-sm">Fill in the details below</p>
                </div>
              </div>

              {activeTab === 'students' && (
                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="text" value={studentForm.fullName} onChange={e => setStudentForm({...studentForm, fullName: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Student Full Name" />
                  <input required type="text" value={studentForm.parentName} onChange={e => setStudentForm({...studentForm, parentName: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Parent Name" />
                  <input required type="tel" value={studentForm.parentPhone} onChange={e => setStudentForm({...studentForm, parentPhone: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="WhatsApp Number" />
                  <select value={studentForm.class} onChange={e => setStudentForm({...studentForm, class: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                    <option>Pre-Nursery</option>
                    <option>Nursery</option>
                    <option>Junior KG</option>
                    <option>Senior KG</option>
                    {Array.from({length: 8}, (_, i) => <option key={i+1}>Class {i+1}</option>)}
                  </select>
                  <button disabled={loading} type="submit" className="md:col-span-2 bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-[0.98]">
                    Register Student
                  </button>
                </form>
              )}

              {activeTab === 'fees' && (
                <form onSubmit={handleAddFee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select required value={feeForm.studentId} onChange={e => setFeeForm({...feeForm, studentId: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2">
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>)}
                  </select>
                  <select value={feeForm.type} onChange={e => setFeeForm({...feeForm, type: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                    <option value="Monthly">Monthly Fee</option>
                    <option value="Admission">Admission Fee</option>
                  </select>
                  <input required type="number" value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Amount (₹)" />
                  {feeForm.type === 'Monthly' && (
                    <select value={feeForm.month} onChange={e => setFeeForm({...feeForm, month: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2">
                      {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  )}
                  <button disabled={loading} type="submit" className="md:col-span-2 bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]">
                    Record Payment
                  </button>
                </form>
              )}

              {(activeTab === 'activities' || activeTab === 'notices') && (
                <form onSubmit={activeTab === 'notices' ? handleAddNotice : handleAddActivity} className="space-y-4">
                  <input required type="text" value={activeTab === 'notices' ? noticeForm.title : activityForm.title} onChange={e => activeTab === 'notices' ? setNoticeForm({...noticeForm, title: e.target.value}) : setActivityForm({...activityForm, title: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Title" />
                  <textarea required value={activeTab === 'notices' ? noticeForm.content : activityForm.description} onChange={e => activeTab === 'notices' ? setNoticeForm({...noticeForm, content: e.target.value}) : setActivityForm({...activityForm, description: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 h-32" placeholder="Description / Content" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTab === 'notices' ? (
                      <select value={noticeForm.priority} onChange={e => setNoticeForm({...noticeForm, priority: e.target.value as any})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                        <option value="normal">Normal Priority</option>
                        <option value="urgent">Urgent Priority</option>
                      </select>
                    ) : (
                      <select value={activityForm.class} onChange={e => setActivityForm({...activityForm, class: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                        <option>All Classes</option>
                        {['Pre-Nursery', 'Nursery', 'Junior KG', 'Senior KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    )}
                    <button disabled={loading} type="submit" className={`bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-[0.98]`}>
                      Post {activeTab.slice(0, -1)}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* List Display View */}
          {!showAddForm && (
            <div className="bg-white rounded-[40px] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                {activeTab === 'students' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase tracking-[0.2em] font-black">
                        <th className="px-8 py-5">Student</th>
                        <th className="px-8 py-5">Parent Contact</th>
                        <th className="px-8 py-5">Class</th>
                        <th className="px-8 py-5">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((student: any) => (
                        <tr key={student.id} className="hover:bg-stone-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="font-bold text-stone-900 group-hover:text-red-600 transition-colors">{student.fullName}</div>
                            <div className="text-[10px] font-bold text-stone-400 mt-0.5 truncate max-w-[200px]">
                              STAFF: {student.registeredByName} {student.registeredByDesignation ? `(${student.registeredByDesignation})` : ''}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="text-sm font-semibold text-stone-700">{student.parentPhone}</div>
                              <button 
                                onClick={() => sendWhatsAppNotification(student.fullName, student.parentPhone, student.class)}
                                className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-stone-100 text-stone-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {student.class}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-bold text-stone-500 uppercase">
                            {formatDate(student.registrationDate?.toDate())}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'inquiries' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase tracking-[0.2em] font-black">
                        <th className="px-8 py-5">Child Details</th>
                        <th className="px-8 py-5">Admission For</th>
                        <th className="px-8 py-5">Status</th>
                        {role === 'admin' && <th className="px-8 py-5">Assign Staff</th>}
                        <th className="px-8 py-5">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((inquiry: any) => (
                        <tr key={inquiry.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-stone-900">{inquiry.studentName}</div>
                            <div className="text-[10px] text-stone-400 font-bold">PAR: {inquiry.fatherName} • {inquiry.mobile1}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-stone-600 underline decoration-stone-200 underline-offset-4">{inquiry.applyingFor}</span>
                          </td>
                          <td className="px-8 py-6">
                            <select
                              value={inquiry.status || 'new'}
                              onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer shadow-sm ${
                                inquiry.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                                inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="enrolled">Enrolled</option>
                            </select>
                          </td>
                          {role === 'admin' && (
                            <td className="px-8 py-6">
                              <select
                                value={inquiry.assignedStaffId || ''}
                                onChange={(e) => handleAssignInquiry(inquiry.id, e.target.value)}
                                className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-stone-900 w-full"
                              >
                                <option value="">Unassigned</option>
                                {staffMembers.map(staff => (
                                  <option key={staff.uid} value={staff.uid}>
                                    {staff.fullName || staff.displayName || staff.email} {staff.designation ? `(${staff.designation})` : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td className="px-8 py-6 font-black text-red-600">₹{inquiry.amountPaid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'fees' && (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/50 text-stone-400 text-[10px] uppercase tracking-[0.2em] font-black">
                        <th className="px-8 py-5">Student</th>
                        <th className="px-8 py-5">Fee Type / Month</th>
                        <th className="px-8 py-5">Amount</th>
                        <th className="px-8 py-5">Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((fee: any) => (
                        <tr key={fee.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="px-8 py-6 font-bold text-stone-900">{fee.studentName}</td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${fee.type === 'Admission' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {fee.type || 'Monthly'}
                              </span>
                              {fee.type !== 'Admission' && (
                                <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-md w-fit">{fee.month}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 font-black text-green-600 text-lg">₹{fee.amount}</td>
                          <td className="px-8 py-6">
                            <div className="text-[10px] font-black text-stone-900 uppercase tracking-tighter truncate max-w-[150px]">
                              {fee.collectedByName}
                            </div>
                            {fee.collectedByDesignation && (
                              <div className="text-[9px] font-bold text-red-500 uppercase -mt-0.5">
                                {fee.collectedByDesignation}
                              </div>
                            )}
                            <div className="text-[10px] font-bold text-stone-400 mt-0.5">{formatDate(fee.timestamp?.toDate())}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {(activeTab === 'activities' || activeTab === 'notices') && (
                  <div className="p-8 space-y-4">
                    {filteredData().map((item: any) => (
                      <div key={item.id} className={`p-8 rounded-[32px] border group hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 ${
                        item.priority === 'urgent' ? 'bg-red-50 border-red-100' : 'bg-stone-50/50 border-stone-100'
                      }`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {activeTab === 'notices' ? <Bell className={`w-5 h-5 ${item.priority === 'urgent' ? 'text-red-600' : 'text-stone-900'}`} /> : <ActivityIcon className="w-5 h-5 text-stone-900" />}
                            <h3 className={`text-xl font-black tracking-tight ${item.priority === 'urgent' ? 'text-red-700' : 'text-stone-900'}`}>{item.title}</h3>
                            {item.priority === 'urgent' && (
                              <span className="px-3 py-1 bg-red-600 text-white text-[8px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-red-600/20">Urgent</span>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-white border border-stone-200 text-stone-900 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-sm group-hover:bg-stone-900 group-hover:text-white transition-colors">
                            {activeTab === 'notices' ? 'Notice' : (item.class || 'All')}
                          </span>
                        </div>
                        <p className="text-stone-600 leading-relaxed mb-6 font-medium">{item.content || item.description}</p>
                        <div className="flex items-center justify-between text-[10px] font-black text-stone-400 uppercase tracking-widest border-t border-stone-100 pt-4">
                          <span>Poster: {item.postedByName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.timestamp?.toDate())}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'messages' && (
                  <div className="p-8 space-y-4">
                    {filteredData().map((msg: any) => (
                      <div key={msg.id} className="p-8 bg-white border border-stone-100 rounded-[32px] hover:shadow-2xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                              <Inbox className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-stone-900 tracking-tight">{msg.parentName}</h4>
                                <p className="text-[10px] font-bold text-stone-400">{msg.mobile}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{formatDate(msg.timestamp?.toDate())}</span>
                        </div>
                        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100 italic text-stone-600 text-sm leading-relaxed">
                          "{msg.message}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="p-10 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black text-stone-900 tracking-tight mb-2">Clean Start Reset</h3>
                      <p className="text-stone-500 text-sm mb-8 leading-relaxed italic">
                        This feature allows you to clear all test data and start fresh. 
                        Records created <span className="text-stone-900 font-bold underline">today (April 18, 2026)</span> will be kept. 
                        All other data will be permanently deleted.
                      </p>
                      
                      <div className="bg-red-50 border border-red-100 p-6 rounded-3xl mb-8 flex items-start gap-4">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Warning</p>
                          <p className="text-xs text-red-600/80 font-medium">This action is irreversible. Please ensure you have backed up any necessary data before proceeding.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reset Application Data
                      </button>
                    </div>
                  </div>
                )}

                {/* Reset Confirmation Modal Overlay */}
                {isResetModalOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <Trash2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-stone-900 tracking-tight">Confirm Reset?</h2>
                        <p className="text-stone-500 text-sm mt-2 italic px-2 leading-relaxed">
                          Today's records will be kept. <br />
                          <span className="text-red-600 font-bold">All old data will be gone forever.</span>
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleResetAppData}
                          disabled={loading}
                          className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Yes, Delete Old Data
                        </button>
                        <button
                          onClick={() => setIsResetModalOpen(false)}
                          disabled={loading}
                          className="w-full bg-stone-100 text-stone-600 font-black py-4 rounded-2xl hover:bg-stone-200 transition-all active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {filteredData().length === 0 && (
                  <div className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-stone-300">
                      <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center">
                        <Search className="w-10 h-10 opacity-20" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest">No matching records</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
