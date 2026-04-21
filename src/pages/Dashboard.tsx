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
  User,
  LayoutDashboard,
  Settings as Cog,
  Trash2,
  AlertTriangle,
  QrCode,
  Download,
  ExternalLink,
  Pencil,
  Smartphone,
  CreditCard,
  History,
  X,
  Info,
  History as HistoryIcon,
  BookOpen
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

interface Note {
  content: string;
  timestamp: any;
  authorName: string;
}

interface Student {
  id: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  aadharNumber: string;
  dob: string;
  parentPhone: string;
  class: string;
  registeredBy: string;
  registeredByName: string;
  registeredByDesignation: string;
  registrationDate: any;
  status: string;
  confirmationSent?: boolean;
  confirmationMethod?: string;
  confirmationSentAt?: any;
  confirmationSentBy?: string;
  notes?: Note[];
  registrationNumber?: string;
}

const getClassCode = (className: string) => {
  const codes: {[key: string]: string} = {
    'Pre-Nursery': 'PN',
    'Nursery': 'N',
    'Junior KG': 'JKG',
    'Senior KG': 'SKG'
  };
  if (className.startsWith('Class ')) {
    return 'C' + className.split(' ')[1];
  }
  return codes[className] || 'GEN';
};

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
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const [useWABusiness, setUseWABusiness] = useState(() => {
    return localStorage.getItem('use_wa_business') === 'true';
  });
  
  // Profile Completion State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    designation: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    aadharNumber: '',
    dob: '',
    parentPhone: '',
    class: 'Nursery'
  });

  const [feeForm, setFeeForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    month: 'April',
    type: 'Monthly',
    paymentMethod: 'Cash',
    paidBy: ''
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

  const sendWhatsAppNotification = async (studentId?: string, studentName?: string, parentPhone?: string, studentClass?: string) => {
    if (!studentId || !studentName || !parentPhone || !studentClass) return;

    // Mark as confirmation sent in database
    try {
      await updateDoc(doc(db, 'students', studentId), {
        confirmationSent: true,
        confirmationMethod: 'whatsapp',
        confirmationSentAt: Timestamp.now(),
        confirmationSentBy: userData?.fullName || user?.displayName || user?.email || 'Staff'
      });
    } catch (err) {
      console.error("Failed to update confirmation status", err);
    }

    const cleanPhone = parentPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const appUrl = window.location.origin;
    const student = students.find(s => s.id === studentId);
    
    let message = '';
    if (role === 'admin') {
      message = `*E.V.S. PUBLIC SCHOOL Admission Confirmation*\n\nDear Parent,\n\nWe are happy to inform you that your child *${studentName}* has been successfully registered in *${studentClass}* at E.V.S. Public School.\n\n*Reg No:* ${student?.registrationNumber || 'Pending'}\n\n*View App:* ${appUrl}`;
    } else {
      const senderName = userData?.fullName || user?.displayName || 'Staff Member';
      message = `*E.V.S. PUBLIC SCHOOL Admission Initiative*\n\nDear Parent,\n\nWe are happy to inform you that the registration process for your child *${studentName}* in *${studentClass}* has been initiated.\n\n*View App:* ${appUrl}`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    
    // Force WhatsApp Business on Android if setting is enabled
    if (useWABusiness) {
      const intentUrl = `intent://send/${formattedPhone}/?text=${encodedMessage}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
      window.location.href = intentUrl;
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, '_blank');
    }
  };

  const sendSMSNotification = async (studentId?: string, studentName?: string, parentPhone?: string, studentClass?: string) => {
    if (!studentId || !studentName || !parentPhone || !studentClass) return;

    // Mark as confirmation sent in database if not already
    try {
      await updateDoc(doc(db, 'students', studentId), {
        confirmationSent: true,
        confirmationMethod: 'sms',
        confirmationSentAt: Timestamp.now(),
        confirmationSentBy: userData?.fullName || user?.displayName || user?.email || 'Staff'
      });
    } catch (err) {
      console.error("Failed to update confirmation status", err);
    }

    const cleanPhone = parentPhone.replace(/\D/g, '');
    
    const appUrl = window.location.origin;
    const student = students.find(s => s.id === studentId);
    
    let message = '';
    if (role === 'admin') {
      message = `E.V.S. PUBLIC SCHOOL: Admission confirmed for ${studentName} (${studentClass}). Reg No: ${student?.registrationNumber || 'N/A'}. View: ${appUrl} Regards, M. D. Dr. Mh Salik`;
    } else {
      const senderName = userData?.fullName || user?.displayName || 'Staff Member';
      message = `E.V.S. PUBLIC SCHOOL: Registration for ${studentName} (${studentClass}) initiated. App: ${appUrl} BY: ${senderName}`;
    }
    
    // SMS protocol with body
    const smsUrl = `sms:${cleanPhone}${navigator.userAgent.match(/iPhone/i) ? '&' : '?'}body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const sendInquiryPromoWhatsApp = (inquiry: any) => {
    const formattedPhone = (inquiry.mobile1 || '').replace(/\D/g, '').length === 10 ? `91${(inquiry.mobile1 || '').replace(/\D/g, '')}` : (inquiry.mobile1 || '').replace(/\D/g, '');
    const appUrl = window.location.origin;
    
    const message = `🌟 *E.V.S. PUBLIC SCHOOL - Admission 2026-27* 🌟\n\n*अस्सलामु अलैकुम!* हमें खुशी है कि आपने अपने बच्चे *${inquiry.studentName}* के उज्जवल भविष्य के लिए हमसे संपर्क किया।\n\n✨ *हमारे स्कूल की विशेषताएं:* ✨\n📚 बेहतरीन आधुनिक शिक्षा (English Medium)\n🕌 दीन और दुनिया का संगम (दीनियात क्लासेस)\n🛡️ सुरक्षित माहौल (CCTV एवं समर्पित स्टाफ)\n🎨 बच्चों की सर्वांगीण उन्नति के लिए गेम्स एवं एक्टिविटीज\n\nअपने बच्चे की सफलता का सफर हमारे साथ शुरू करें।\n\n✅ *अभी रजिस्ट्रेशन कराएं:* https://evspublicschool.vercel.app/\n\n📍 *E.V.S. Public School*\nNear Petrol Pump, Saharanpur Road, Chilkana\n📞 संपर्क करें: +91-8954555074`;
    
    const encodedMessage = encodeURIComponent(message);
    
    if (useWABusiness) {
      const intentUrl = `intent://send/${formattedPhone}/?text=${encodedMessage}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
      window.location.href = intentUrl;
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, '_blank');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Generate Registration Number
      const year = new Date().getFullYear();
      const stQuery = query(collection(db, 'students'), where('class', '==', studentForm.class));
      const snapshot = await getDocs(stQuery);
      const classCode = getClassCode(studentForm.class);
      const sequence = (snapshot.size + 1).toString().padStart(3, '0');
      const registrationNumber = `EVS/${classCode}/${year}/${sequence}`;

      const docRef = await addDoc(collection(db, 'students'), {
        ...studentForm,
        registrationNumber,
        registeredBy: user.uid,
        registeredByName: userData?.fullName || user.displayName || user.email || user.phoneNumber || 'Staff Member',
        registeredByDesignation: userData?.designation || '',
        registrationDate: Timestamp.now(),
        status: 'confirmed',
        confirmationSent: false
      });
      await addDoc(collection(db, 'notifications'), {
        type: 'registration',
        message: `New student ${studentForm.fullName} registered by ${userData?.fullName || user.displayName || user.phoneNumber}`,
        timestamp: Timestamp.now(),
        read: false
      });

      // Post as a school activity to show on front page
      await addDoc(collection(db, 'activities'), {
        title: 'New Admission!',
        description: `We are delighted to welcome ${studentForm.fullName} to ${studentForm.class}. Congratulations on the fresh beginning!`,
        class: studentForm.class,
        timestamp: Timestamp.now(),
        postedBy: user.uid,
        postedByName: userData?.fullName || user.displayName || 'Office'
      });
      
      const studentId = docRef.id;
      const registeredStudent = { ...studentForm };
      
      toast.success('Student registered successfully!', {
        description: 'Send confirmation message to parent.',
        action: {
          label: 'WhatsApp',
          onClick: () => sendWhatsAppNotification(studentId, registeredStudent.fullName, registeredStudent.parentPhone, registeredStudent.class)
        },
        cancel: {
          label: 'SMS',
          onClick: () => sendSMSNotification(studentId, registeredStudent.fullName, registeredStudent.parentPhone, registeredStudent.class)
        },
        duration: 20000
      });
      
      setStudentForm({ fullName: '', fatherName: '', motherName: '', aadharNumber: '', dob: '', parentPhone: '', class: 'Nursery' });
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFeeWhatsApp = (studentName: string, parentPhone: string, amount: number, month: string, type: string, paymentMethod: string) => {
    const cleanPhone = parentPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const senderName = userData?.fullName || user?.displayName || 'Office';
    
    let message = '';
    const appUrl = window.location.origin;
    
    if (type === 'Admission') {
      message = `*E.V.S. PUBLIC SCHOOL - Admission Fee Confirmation*\n\nDear Parent,\n\nCongratulations! We have received the *Admission Fee* of *₹${amount}* for *${studentName}*.\n\nYour child is now officially part of the E.V.S. Public School family.\n\n*Receipt Details:*\n- Amount: ₹${amount}\n- Method: ${paymentMethod}\n- Date: ${new Date().toLocaleDateString('en-IN')}\n\n*Open App:* ${appUrl}\n\n_Regards,_\n*E.V.S. Public School*\n_Processed By: ${senderName}_`;
    } else {
      message = `*E.V.S. PUBLIC SCHOOL - Fee Receipt*\n\nDear Parent,\n\nWe have received your payment of *₹${amount}* for *${studentName}* towards Monthly Fee for *${month}*.\n\n*Payment Details:*\n- Amount: ₹${amount}\n- Method: ${paymentMethod}\n- Date: ${new Date().toLocaleDateString('en-IN')}\n\n*View Progress:* ${appUrl}\n\n_Regards,_\n*E.V.S. Public School*\n_Processed By: ${senderName}_`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    
    if (useWABusiness) {
      const intentUrl = `intent://send/${formattedPhone}/?text=${encodedMessage}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
      window.location.href = intentUrl;
    } else {
      window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, '_blank');
    }
  };

  const sendFeeSMS = (studentName: string, parentPhone: string, amount: number, month: string, type: string) => {
    let message = '';
    const appUrl = window.location.origin;
    if (type === 'Admission') {
      message = `E.V.S. PUBLIC SCHOOL: Admission Fee of Rs.${amount} received for ${studentName}. Welcome to our school family. Open App: ${appUrl} Thank you.`;
    } else {
      const detailText = `Monthly Fee (${month})`;
      message = `E.V.S. PUBLIC SCHOOL: Fee of Rs.${amount} received for ${studentName} (${detailText}). View details: ${appUrl} Thank you.`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`sms:${parentPhone}?body=${encodedMessage}`, '_blank');
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

      const currentFee = { ...feeForm };
      const currentStudent = { ...selectedStudent };

      toast.success('Fee recorded successfully!', {
        description: 'Send receipt to parent.',
        action: {
          label: 'WhatsApp',
          onClick: () => sendFeeWhatsApp(currentStudent.fullName!, currentStudent.parentPhone!, Number(currentFee.amount), currentFee.month, currentFee.type, currentFee.paymentMethod)
        },
        cancel: {
          label: 'SMS',
          onClick: () => sendFeeSMS(currentStudent.fullName!, currentStudent.parentPhone!, Number(currentFee.amount), currentFee.month, currentFee.type)
        },
        duration: 20000
      });

      setFeeForm({ studentId: '', studentName: '', amount: '', month: 'April', type: 'Monthly', paymentMethod: 'Cash', paidBy: '' });
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

  const handleAddNote = async (studentId: string) => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      const note: Note = {
        content: newNote,
        timestamp: Timestamp.now(),
        authorName: userData?.fullName || user?.displayName || user?.phoneNumber || 'Admin'
      };
      
      const updatedNotes = [...(student.notes || []), note];
      await updateDoc(doc(db, 'students', studentId), {
        notes: updatedNotes
      });
      
      setNewNote('');
      toast.success('Note added successfully');
      // Update local state if needed (snapshot will handle it though)
    } catch (error: any) {
      toast.error('Failed to add note: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setLoading(true);
    try {
      const studentId = editingStudent.id;
      const { id, registrationNumber, registrationDate, registeredBy, registeredByName, registeredByDesignation, status, ...updateData } = editingStudent;
      
      await updateDoc(doc(db, 'students', studentId), updateData);
      
      setIsEditStudentModalOpen(false);
      setEditingStudent(null);
      toast.success('Student details updated successfully');
    } catch (error: any) {
      toast.error('Failed to update student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'fees', editingFee.id), {
        amount: Number(editingFee.amount),
        month: editingFee.month,
        type: editingFee.type,
        paymentMethod: editingFee.paymentMethod,
        paidBy: editingFee.paidBy
      });
      toast.success('Fee record updated successfully!');
      setIsEditFeeModalOpen(false);
      setEditingFee(null);
    } catch (error: any) {
      toast.error('Failed to update fee record');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return;
    try {
      await deleteDoc(doc(db, 'fees', feeId));
      toast.success('Fee record deleted');
    } catch (error) {
      toast.error('Failed to delete record');
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
      const staff = staffMembers.find(s => s.id === staffId);
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        assignedStaffId: staffId,
        assignedStaffName: staff?.fullName || staff?.displayName || staff?.email || 'Unknown Staff',
        assignedStaffDesignation: staff?.designation || ''
      });
      toast.success(`Inquiry assigned to ${staff?.fullName || staff?.displayName || staff?.email || 'Staff'}`);
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
  const qrRef = React.useRef<HTMLCanvasElement>(null);

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas for the poster
    const posterCanvas = document.createElement('canvas');
    const ctx = posterCanvas.getContext('2d');
    if (!ctx) return;

    const padding = 60;
    const qrSize = 400;
    const headerHeight = 100;
    const footerHeight = 80;
    
    posterCanvas.width = qrSize + (padding * 2);
    posterCanvas.height = qrSize + headerHeight + footerHeight + (padding * 2);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);

    // Header Text - E.V.S. PUBLIC SCHOOL
    ctx.fillStyle = '#1c1917'; // stone-900
    ctx.font = '900 36px Urbanist, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E.V.S. PUBLIC SCHOOL', posterCanvas.width / 2, padding + 40);

    // Subtitle
    ctx.font = '800 18px Urbanist, Inter, sans-serif';
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.fillText('OFFICIAL ADMISSION PORTAL', posterCanvas.width / 2, padding + 75);

    // Draw QR Code
    ctx.drawImage(canvas, padding, padding + headerHeight, qrSize, qrSize);

    // Footer Text
    ctx.fillStyle = '#78716c'; // stone-500
    ctx.font = 'bold 16px Urbanist, Inter, sans-serif';
    ctx.fillText('SCAN TO APPLY ONLINE', posterCanvas.width / 2, posterCanvas.height - padding - 20);

    const url = posterCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "evs-school-qr-poster.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  value={profileForm.fullName ?? ''}
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
                  value={profileForm.designation ?? ''}
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
                  <input required type="text" value={studentForm.fullName ?? ''} onChange={e => setStudentForm({...studentForm, fullName: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Student Full Name" />
                  <input required type="text" value={studentForm.fatherName ?? ''} onChange={e => setStudentForm({...studentForm, fatherName: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Father's Name" />
                  <input type="text" value={studentForm.motherName ?? ''} onChange={e => setStudentForm({...studentForm, motherName: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Mother's Name" />
                  <input required type="date" value={studentForm.dob ?? ''} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Date of Birth" />
                  <input required type="text" value={studentForm.aadharNumber ?? ''} onChange={e => setStudentForm({...studentForm, aadharNumber: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Aadhar Number" />
                  <input required type="tel" value={studentForm.parentPhone ?? ''} onChange={e => setStudentForm({...studentForm, parentPhone: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="WhatsApp Number" />
                  <select value={studentForm.class ?? ''} onChange={e => setStudentForm({...studentForm, class: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
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
                  <select required value={feeForm.studentId ?? ''} onChange={e => setFeeForm({...feeForm, studentId: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2">
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>)}
                  </select>
                  <select value={feeForm.type ?? ''} onChange={e => setFeeForm({...feeForm, type: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                    <option value="Monthly">Monthly Fee</option>
                    <option value="Admission">Admission Fee</option>
                  </select>
                  <input required type="number" value={feeForm.amount ?? ''} onChange={e => setFeeForm({...feeForm, amount: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Amount (₹)" />
                  {feeForm.type === 'Monthly' && (
                    <select value={feeForm.month ?? ''} onChange={e => setFeeForm({...feeForm, month: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2">
                      {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  <select value={feeForm.paymentMethod ?? ''} onChange={e => setFeeForm({...feeForm, paymentMethod: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                    <option value="Cash">Cash Payment</option>
                    <option value="Online">Online Transfer</option>
                  </select>
                  <input required type="text" value={feeForm.paidBy ?? ''} onChange={e => setFeeForm({...feeForm, paidBy: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Payer Name (e.g. Father)" />
                  <button disabled={loading} type="submit" className="md:col-span-2 bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]">
                    Record Payment
                  </button>
                </form>
              )}

              {(activeTab === 'activities' || activeTab === 'notices') && (
                <form onSubmit={activeTab === 'notices' ? handleAddNotice : handleAddActivity} className="space-y-4">
                  <input required type="text" value={(activeTab === 'notices' ? noticeForm.title : activityForm.title) ?? ''} onChange={e => activeTab === 'notices' ? setNoticeForm({...noticeForm, title: e.target.value}) : setActivityForm({...activityForm, title: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900" placeholder="Title" />
                  <textarea required value={(activeTab === 'notices' ? noticeForm.content : activityForm.description) ?? ''} onChange={e => activeTab === 'notices' ? setNoticeForm({...noticeForm, content: e.target.value}) : setActivityForm({...activityForm, description: e.target.value})} className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900 h-32" placeholder="Description / Content" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTab === 'notices' ? (
                      <select value={noticeForm.priority ?? ''} onChange={e => setNoticeForm({...noticeForm, priority: e.target.value as any})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
                        <option value="normal">Normal Priority</option>
                        <option value="urgent">Urgent Priority</option>
                      </select>
                    ) : (
                      <select value={activityForm.class ?? ''} onChange={e => setActivityForm({...activityForm, class: e.target.value})} className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-stone-900">
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
                        <th className="px-8 py-5">Reg Info</th>
                        <th className="px-8 py-5">Student / Details</th>
                        <th className="px-8 py-5">Family Details</th>
                        <th className="px-8 py-5">Contact</th>
                        <th className="px-8 py-5">Class</th>
                        <th className="px-8 py-5">Joined</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((student: any) => (
                        <tr key={student.id} className="hover:bg-stone-50/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 inline-block">
                              {student.registrationNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  setIsStudentProfileOpen(true);
                                }}
                                className="font-bold text-stone-900 group-hover:text-red-600 transition-colors hover:underline text-left"
                              >
                                {student.fullName}
                              </button>
                              {student.confirmationSent && (
                                <div className="flex items-center gap-1">
                                  <div className={`${student.confirmationMethod === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-stone-900 text-white'} p-0.5 rounded-full`} title={`Confirmed via ${student.confirmationMethod?.toUpperCase()} by ${student.confirmationSentBy}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>
                                  {role === 'admin' && (
                                    <span className="text-[8px] font-black uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">
                                      {student.confirmationMethod === 'whatsapp' ? 'WA' : 'SMS'} • {student.confirmationSentBy?.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-stone-400 mt-0.5">AADHAR: {student.aadharNumber || 'N/A'}</div>
                            <div className="text-[10px] font-bold text-stone-400">DOB: {student.dob || 'N/A'}</div>
                            {role === 'admin' && student.confirmationSent && (
                              <div className="text-[8px] font-bold text-stone-300 mt-1 uppercase">
                                Sent: {formatDate(student.confirmationSentAt?.toDate())}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-bold text-stone-700">F: {student.fatherName || student.parentName}</div>
                            <div className="text-[10px] text-stone-400">M: {student.motherName || 'N/A'}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-sm font-semibold text-stone-700 mr-2">{student.parentPhone}</div>
                              <button 
                                onClick={() => sendWhatsAppNotification(student.id, student.fullName, student.parentPhone, student.class)}
                                className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${
                                  student.confirmationSent 
                                  ? 'bg-stone-100 text-stone-400 hover:bg-stone-200' 
                                  : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                                }`}
                                title="Send WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => sendSMSNotification(student.id, student.fullName, student.parentPhone, student.class)}
                                className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${
                                  student.confirmationSent 
                                  ? 'bg-stone-100 text-stone-400 hover:bg-stone-200' 
                                  : 'bg-stone-900 text-white hover:bg-black'
                                }`}
                                title="Send SMS Fallback"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-stone-100 text-stone-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {student.class}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-[10px] font-bold text-stone-500 uppercase">
                            <div>{formatDate(student.registrationDate?.toDate())}</div>
                            <div className="text-stone-300 mt-1">BY: {student.registeredByName}</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => {
                                setEditingStudent(student);
                                setIsEditStudentModalOpen(true);
                              }}
                              className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                              title="Edit Student"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
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
                        <th className="px-8 py-5">Assigned To</th>
                        <th className="px-8 py-5">Fee / Marketing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((inquiry: any) => (
                        <tr key={inquiry.id} className="hover:bg-stone-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold text-stone-900">{inquiry.studentName}</div>
                            <div className="text-[10px] text-stone-400 font-bold">F: {inquiry.fatherName} • {inquiry.mobile1}</div>
                            <div className="text-[10px] text-red-600 font-black uppercase tracking-tight">VILLAGE: {inquiry.village || 'N/A'}</div>
                            <div className="text-[10px] text-stone-400">DOB: {inquiry.dob} • ADR: {inquiry.aadharNumber || 'N/A'}</div>
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
                          <td className="px-8 py-6">
                            {role === 'admin' ? (
                              <div className="relative group">
                                <select
                                  value={inquiry.assignedStaffId || ''}
                                  onChange={(e) => handleAssignInquiry(inquiry.id, e.target.value)}
                                  className={`w-full bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-stone-900 transition-all appearance-none cursor-pointer ${
                                    inquiry.assignedStaffId ? 'text-stone-900' : 'text-stone-400'
                                  }`}
                                >
                                  <option value="">Unassigned</option>
                                  {staffMembers.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                      {staff.fullName || staff.displayName || staff.email} {staff.designation ? `(${staff.designation})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                  <ChevronDown className="w-3 h-3" />
                                </div>
                              </div>
                            ) : (
                              <div>
                                {inquiry.assignedStaffId ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center">
                                      <User className="w-3 h-3 text-stone-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-stone-600">{inquiry.assignedStaffName || 'Staff'}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-stone-300 italic uppercase tracking-wider">Unassigned</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <span className="font-black text-red-600">₹{inquiry.amountPaid}</span>
                              <button
                                onClick={() => sendInquiryPromoWhatsApp(inquiry)}
                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95 group flex items-center gap-2"
                                title="Send Invite Card"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase hidden group-hover:block">Invite</span>
                              </button>
                            </div>
                          </td>
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
                        <th className="px-8 py-5">Amount / Method</th>
                        <th className="px-8 py-5">Record / Collector</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredData().map((fee: any) => {
                        const student = students.find(s => s.id === fee.studentId);
                        return (
                          <tr key={fee.id} className="hover:bg-stone-50/30 transition-colors group">
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
                            <td className="px-8 py-6">
                              <div className="font-black text-green-600 text-lg">₹{fee.amount}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${fee.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {fee.paymentMethod || 'Cash'}
                                </span>
                                {fee.paidBy && <span className="text-[9px] font-bold text-stone-400 truncate max-w-[80px]">By: {fee.paidBy}</span>}
                              </div>
                            </td>
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
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 transition-all">
                                <button
                                  onClick={() => {
                                    if (student) {
                                      sendFeeWhatsApp(student.fullName, student.parentPhone, fee.amount, fee.month, fee.type, fee.paymentMethod);
                                    } else {
                                      toast.error('Student data not found');
                                    }
                                  }}
                                  title="Send WhatsApp"
                                  className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (student) {
                                      sendFeeSMS(student.fullName, student.parentPhone, fee.amount, fee.month, fee.type);
                                    } else {
                                      toast.error('Student data not found');
                                    }
                                  }}
                                  title="Send SMS"
                                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                >
                                  <Smartphone className="w-4 h-4" />
                                </button>
                                {(role === 'admin' || fee.collectedBy === user.uid) && (
                                  <button
                                    onClick={() => {
                                      setEditingFee(fee);
                                      setIsEditFeeModalOpen(true);
                                    }}
                                    title="Edit Record"
                                    className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                                {role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteFee(fee.id)}
                                    title="Delete Record"
                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

                      <div className="mt-8 bg-stone-50 rounded-2xl p-6 border border-dashed border-stone-200">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <QrCode className="w-3 h-3 text-red-500" />
                          App QR Code & Sharing
                        </h4>
                        <div className="flex flex-col items-center gap-6 py-4">
                          <div className="bg-white p-8 rounded-[48px] shadow-2xl border-4 border-stone-900 shadow-stone-900/10 flex flex-col items-center gap-6">
                            <div className="text-center">
                              <h3 className="text-xl font-black text-stone-900 tracking-tighter">E.V.S. PUBLIC SCHOOL</h3>
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Admission Portal</p>
                            </div>
                            
                            <div className="bg-stone-50 p-4 rounded-[32px]">
                              <QRCodeCanvas 
                                ref={qrRef}
                                value={window.location.origin} 
                                size={200}
                                level="H"
                                includeMargin={false}
                              />
                            </div>

                            <div className="text-center">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Scan to verify & apply</p>
                            </div>
                          </div>
                          
                          <div className="text-center space-y-2 mt-4">
                            <p className="text-xs font-black text-stone-900 opacity-60">
                              {window.location.host}
                            </p>
                          </div>

                          <div className="flex w-full gap-2 mt-2 flex-wrap sm:flex-nowrap">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin);
                                toast.success('Link copied to clipboard!');
                              }}
                              className="flex-1 bg-white border border-stone-200 text-stone-900 text-[10px] font-black py-3 px-4 rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Copy Link
                            </button>
                            <button 
                              onClick={downloadQR}
                              className="flex-1 bg-white border border-stone-200 text-stone-900 text-[10px] font-black py-3 px-4 rounded-xl hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                            >
                              <Download className="w-3 h-3 text-red-500" />
                              Download QR
                            </button>
                            <a 
                              href={window.location.origin}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 bg-stone-900 text-white text-[10px] font-black py-3 px-4 rounded-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open Link
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 bg-stone-50 rounded-2xl p-6 border border-dashed border-stone-200">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MessageSquare className="w-3 h-3 text-red-500" />
                          WhatsApp Preferences
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-600">Force WhatsApp Business (Android)</span>
                          <button 
                            onClick={() => {
                              const newValue = !useWABusiness;
                              setUseWABusiness(newValue);
                              localStorage.setItem('use_wa_business', String(newValue));
                              toast.success(newValue ? 'Forcing WhatsApp Business' : 'Default WhatsApp used');
                            }}
                            className={`w-12 h-6 rounded-full transition-all relative ${useWABusiness ? 'bg-green-500' : 'bg-stone-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useWABusiness ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-3 italic">
                          Enable this if messages are opening in normal WhatsApp instead of Business account.
                        </p>
                      </div>
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

                {/* Edit Fee Modal Overlay */}
                {isEditFeeModalOpen && editingFee && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md" onClick={() => setIsEditFeeModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center">
                          <Pencil className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-stone-900 tracking-tighter">Edit Fee Record</h3>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">Updating payment for {editingFee.studentName}</p>
                        </div>
                      </div>
                      
                      <form onSubmit={handleUpdateFee} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Payment Type</label>
                            <select 
                              value={editingFee.type ?? ''} 
                              onChange={e => setEditingFee({...editingFee, type: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            >
                              <option value="Monthly">Monthly Fee</option>
                              <option value="Admission">Admission Fee</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                            <input 
                              required 
                              type="number" 
                              value={editingFee.amount ?? ''} 
                              onChange={e => setEditingFee({...editingFee, amount: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                        </div>

                        {editingFee.type === 'Monthly' && (
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Fee Month</label>
                            <select 
                              value={editingFee.month ?? ''} 
                              onChange={e => setEditingFee({...editingFee, month: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            >
                              {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Method</label>
                            <select 
                              value={editingFee.paymentMethod ?? ''} 
                              onChange={e => setEditingFee({...editingFee, paymentMethod: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Online">Online</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Paid By</label>
                            <input 
                              required 
                              type="text" 
                              value={editingFee.paidBy ?? ''} 
                              onChange={e => setEditingFee({...editingFee, paidBy: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-stone-900"
                              placeholder="Name of payer"
                            />
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                          <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/10"
                          >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Record'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditFeeModalOpen(false)}
                            className="w-full bg-stone-50 text-stone-500 font-bold py-4 rounded-2xl hover:bg-stone-100 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Student Profile Modal */}
                {isStudentProfileOpen && selectedStudent && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div 
                      className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                      onClick={() => setIsStudentProfileOpen(false)}
                    />
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                      {/* Modal Header */}
                      <div className="bg-stone-900 p-8 text-white">
                        <button 
                          onClick={() => setIsStudentProfileOpen(false)}
                          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20">
                            <Users className="w-10 h-10" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-3xl font-black tracking-tight">{selectedStudent.fullName}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    {selectedStudent.class}
                                  </span>
                                  <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                                    ID: {selectedStudent.id.slice(-8).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setIsStudentProfileOpen(false);
                                  setEditingStudent(selectedStudent);
                                  setIsEditStudentModalOpen(true);
                                }}
                                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all group"
                              >
                                <Pencil className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Edit Profile</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Content - Scrollable */}
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Column 1: Basic Info */}
                          <div className="lg:col-span-1 space-y-6">
                            <section>
                              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Basic Details
                              </h3>
                              <div className="bg-stone-50 rounded-3xl p-5 space-y-4">
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Registration Number</p>
                                  <p className="text-sm font-black text-red-600">{selectedStudent.registrationNumber || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Father's Name</p>
                                  <p className="text-sm font-bold text-stone-900">{selectedStudent.fatherName}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Mother's Name</p>
                                  <p className="text-sm font-bold text-stone-900">{selectedStudent.motherName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Aadhar Number</p>
                                  <p className="text-sm font-bold text-stone-900">{selectedStudent.aadharNumber}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Date of Birth</p>
                                  <p className="text-sm font-bold text-stone-900">{selectedStudent.dob}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">WhatsApp Number</p>
                                  <p className="text-sm font-bold text-stone-900">{selectedStudent.parentPhone}</p>
                                </div>
                              </div>
                            </section>

                            <section>
                              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <History className="w-3 h-3" /> Registration
                              </h3>
                              <div className="bg-stone-50 rounded-3xl p-5">
                                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Joined On</p>
                                <p className="text-sm font-bold text-stone-900 mb-4">{formatDate(selectedStudent.registrationDate?.toDate())}</p>
                                
                                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Registered By</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-6 h-6 bg-stone-200 rounded-lg flex items-center justify-center text-[10px] font-bold">
                                    {selectedStudent.registeredByName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-stone-900">{selectedStudent.registeredByName}</p>
                                    <p className="text-[8px] font-black text-red-600 uppercase tracking-tighter">{selectedStudent.registeredByDesignation || 'Staff'}</p>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>

                          {/* Column 2 & 3: History & Notes */}
                          <div className="lg:col-span-2 space-y-8">
                            {/* Fee History */}
                            <section>
                              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard className="w-3 h-3" /> Fee Payment History
                              </h3>
                              <div className="bg-stone-50 rounded-[32px] overflow-hidden border border-stone-100">
                                <table className="w-full text-left">
                                  <thead className="bg-stone-100/50">
                                    <tr className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                      <th className="px-6 py-4">Month/Type</th>
                                      <th className="px-6 py-4 text-center">Amount</th>
                                      <th className="px-6 py-4">Method</th>
                                      <th className="px-6 py-4 text-right">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-100">
                                    {fees.filter(f => f.studentId === selectedStudent.id).length > 0 ? (
                                      fees.filter(f => f.studentId === selectedStudent.id)
                                        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                                        .map(fee => (
                                          <tr key={fee.id} className="text-xs border-b border-stone-100 last:border-0 hover:bg-white transition-colors">
                                            <td className="px-6 py-4">
                                              <span className="font-bold text-stone-900">{fee.type === 'Monthly' ? fee.month : fee.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                              <span className="font-black text-green-600">₹{fee.amount}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${fee.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {fee.paymentMethod}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                              <span className="text-[10px] font-medium text-stone-400">{formatDate(fee.timestamp?.toDate())}</span>
                                            </td>
                                          </tr>
                                        ))
                                    ) : (
                                      <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-stone-400 text-xs font-bold uppercase italic">
                                          No payment records found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </section>

                            {/* Internal Notes */}
                            <section>
                              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Internal Notes
                              </h3>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    placeholder="Add a private note about this student..."
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote(selectedStudent.id)}
                                  />
                                  <button 
                                    onClick={() => handleAddNote(selectedStudent.id)}
                                    disabled={loading || !newNote.trim()}
                                    className="bg-stone-900 text-white px-6 rounded-2xl font-bold text-xs hover:bg-stone-800 transition-all disabled:opacity-50"
                                  >
                                    Add Note
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {selectedStudent.notes && selectedStudent.notes.length > 0 ? (
                                    [...selectedStudent.notes].reverse().map((note, idx) => (
                                      <div key={idx} className="bg-stone-50 p-5 rounded-3xl border border-stone-100 group hover:border-stone-300 transition-colors">
                                        <p className="text-sm text-stone-700 leading-relaxed font-medium">{note.content}</p>
                                        <div className="flex items-center justify-between mt-3">
                                          <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">
                                            By: {note.authorName}
                                          </p>
                                          <p className="text-[9px] font-bold text-stone-400">
                                            {formatDate(note.timestamp?.toDate())}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="bg-stone-50/50 border border-dashed border-stone-200 p-8 rounded-3xl text-center">
                                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest italic">No private notes created yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Student Modal */}
                {isEditStudentModalOpen && editingStudent && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div 
                      className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
                      onClick={() => setIsEditStudentModalOpen(false)}
                    />
                    <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                      <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center">
                            <Pencil className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-stone-900 tracking-tighter">Edit Student Details</h3>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">Updating record for {editingStudent.fullName}</p>
                          </div>
                        </div>

                        <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                              required 
                              type="text" 
                              value={editingStudent.fullName ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, fullName: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Father's Name</label>
                            <input 
                              required 
                              type="text" 
                              value={editingStudent.fatherName ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, fatherName: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Mother's Name</label>
                            <input 
                              type="text" 
                              value={editingStudent.motherName ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, motherName: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Date of Birth</label>
                            <input 
                              required 
                              type="date" 
                              value={editingStudent.dob ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Aadhar Number</label>
                            <input 
                              required 
                              type="text" 
                              value={editingStudent.aadharNumber ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, aadharNumber: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                            <input 
                              required 
                              type="tel" 
                              value={editingStudent.parentPhone ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, parentPhone: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest ml-1">Student Class</label>
                            <select 
                              value={editingStudent.class ?? ''} 
                              onChange={e => setEditingStudent({...editingStudent, class: e.target.value})} 
                              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                            >
                              <option>Pre-Nursery</option>
                              <option>Nursery</option>
                              <option>Junior KG</option>
                              <option>Senior KG</option>
                              {Array.from({length: 8}, (_, i) => <option key={i+1}>Class {i+1}</option>)}
                            </select>
                          </div>

                          <div className="md:col-span-2 pt-4 flex flex-col gap-3">
                            <button
                              disabled={loading}
                              type="submit"
                              className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/10"
                            >
                              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditStudentModalOpen(false)}
                              className="w-full bg-stone-50 text-stone-500 font-bold py-4 rounded-2xl hover:bg-stone-100 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
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
