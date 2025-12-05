import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Menu, 
  Plus, 
  Search, 
  Sun, 
  Star, 
  Calendar, 
  User as UserIcon, 
  Home, 
  List as ListIcon, 
  MoreHorizontal, 
  ChevronRight, 
  Bell, 
  Trash2, 
  X,
  LogOut,
  Palette,
  ArrowUpDown,
  Printer,
  Mail,
  Pin,
  CheckCircle2,
  ChevronRight as ChevronRightIcon,
  Repeat,
  Clock,
  ChevronDown,
  Settings,
  RefreshCw,
  UserCog,
  ArrowLeft,
  LayoutList,
  Twitter,
  Facebook,
  Heart,
  Info,
  AlertCircle,
  PlusCircle,
  Circle,
  Infinity,
  FolderPlus,
  Folder,
  UserPlus,
  Lightbulb 
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously, 
  onAuthStateChanged,
  signOut,
  updateProfile,
  signInWithCustomToken,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  enableIndexedDbPersistence,
  serverTimestamp,
  where
} from 'firebase/firestore';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
      console.warn('Persistence not supported by browser');
    }
  });
} catch(e) { console.log("Persistence already enabled or error"); }


// --- Types ---
interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  isImportant: boolean;
  addedToMyDay: boolean;
  listId: string;
  description?: string;
  dueDate?: string;      
  reminderAt?: string;   
  repeat?: string;        
  createdAt: number;
}

interface ToDoList {
  id: string;
  title: string;
  icon?: string;
  type: 'system' | 'user' | 'folder'; 
  theme?: string; 
  createdAt?: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

type SortOption = 'creation' | 'importance' | 'dueDate' | 'alphabetical';

// --- Constants ---
const themes = [
  { id: 'safari', name: 'Montañas', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2574&auto=format&fit=crop' },
  { id: 'ocean', name: 'Océano', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2574&auto=format&fit=crop' },
  { id: 'desert', name: 'Desierto', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2574&auto=format&fit=crop' },
  { id: 'forest', name: 'Bosque', url: 'https://images.unsplash.com/photo-1448375240586-dfd8f3793371?q=80&w=2574&auto=format&fit=crop' },
  { id: 'dark', name: 'Gris Oscuro', color: '#111111' },
  { id: 'blue', name: 'Azul Real', color: '#1e3a8a' },
  { id: 'purple', name: 'Púrpura', color: '#581c87' },
  { id: 'red', name: 'Rojo', color: '#7f1d1d' },
  { id: 'green', name: 'Verde', color: '#14532d' },
  { id: 'pink', name: 'Rosa', color: '#831843' },
];

const systemLists: ToDoList[] = [
  { id: 'my-day', title: 'Mi día', icon: 'Sun', type: 'system' },
  { id: 'important', title: 'Importante', icon: 'Star', type: 'system' },
  { id: 'planned', title: 'Planeado', icon: 'Calendar', type: 'system' },
  { id: 'all', title: 'Todo', icon: 'Infinity', type: 'system' },
  { id: 'completed', title: 'Completadas', icon: 'CheckCircle2', type: 'system' },
  { id: 'assigned', title: 'Asignadas a mí', icon: 'User', type: 'system' },
  { id: 'overdue', title: 'Vencimiento hoy', icon: 'AlertCircle', type: 'system' },
  { id: 'addedToMyDay', title: 'Se agregaron a Mi día', icon: 'PlusCircle', type: 'system' },
  { id: 'uncompleted', title: 'No se completaron', icon: 'Circle', type: 'system' },
  { id: 'tasks', title: 'Tareas', icon: 'Home', type: 'system' },
];

// --- Helper Functions ---
// Removed generateStableId to prevent permission errors. We must use real UIDs.

// --- Components ---

export default function App() {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ToDoList[]>([]);
  const [activeListId, setActiveListId] = useState<string>('my-day');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
   
  // Suggestions State
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Creation Modal State
  const [creationModal, setCreationModal] = useState<{ isOpen: boolean; type: 'list' | 'folder' }>({ isOpen: false, type: 'list' });
  const [creationName, setCreationName] = useState('');

  // Smart Lists Visibility State
  const [smartListsVisibility, setSmartListsVisibility] = useState({
    important: true,
    planned: true,
    completed: false,
    all: false,
    assigned: true,
    overdue: false,
    addedToMyDay: false,
    uncompleted: false
  });

  // Manage Accounts Modal State
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<User[]>([]); // New state for account history

  // New Task Input State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [newTaskMetadata, setNewTaskMetadata] = useState<{
    dueDate: Date | null;
    reminder: string | null;
    repeat: string | null;
    targetListId: string;
  }>({ dueDate: null, reminder: null, repeat: null, targetListId: 'tasks' });
   
  // Popovers State for Input
  const [activeInputPopover, setActiveInputPopover] = useState<'date' | 'reminder' | 'repeat' | 'list' | null>(null);

  // Menu States
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [activeSubMenu, setActiveSubMenu] = useState<'sort' | null>(null);
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [sortOption, setSortOption] = useState<SortOption>('creation');
  const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);

  // Auth States
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  // Refs for click outside
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // --- FIREBASE AUTH & DATA SYNC ---

  // 1. Initial Auth Check & Saved Accounts Load
  useEffect(() => {
    // Load saved accounts from localStorage
    const saved = localStorage.getItem('todo_saved_accounts');
    if (saved) {
      try {
        setSavedAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved accounts");
      }
    }

    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Custom token login failed", e);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        let currentUser: User;

        // --- LOGICA DE RESTAURACIÓN DE SESIÓN SIMULADA ---
        const storedActiveEmail = localStorage.getItem('current_active_email');
        
        if (firebaseUser.isAnonymous && storedActiveEmail) {
             const fakeName = storedActiveEmail.includes('@') ? storedActiveEmail.split('@')[0] : storedActiveEmail;
             currentUser = {
               id: firebaseUser.uid, // USAR UID REAL
               name: fakeName,
               email: storedActiveEmail,
               avatar: `https://ui-avatars.com/api/?name=${fakeName}&background=random&color=fff`
             };
        } else {
            // Standard Real User
            currentUser = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
                email: firebaseUser.email || 'Sin correo',
                avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || firebaseUser.email || 'User'}&background=7c3aed&color=fff`
            };
        }
        
        setUser(currentUser);

        // Update saved accounts list with ROBUST deduplication
        setSavedAccounts(prev => {
            const lowerEmail = currentUser.email.toLowerCase();
            
            const filtered = prev.filter(u => {
                // Eliminar si es el mismo ID
                if (u.id === currentUser.id) return false;
                
                // Eliminar si es el mismo Email/Identificador (case insensitive)
                if (u.email.toLowerCase() === lowerEmail) return false;
                
                // Limpieza extra: Eliminar usuarios "rotos" o "sin correo" generados por bugs anteriores
                if (u.email === 'Sin correo' || u.name === 'Usuario') return false;

                return true;
            });
            
            const updated = [currentUser, ...filtered];
            localStorage.setItem('todo_saved_accounts', JSON.stringify(updated));
            return updated;
        });

      } else {
        setUser(null);
        setTasks([]);
        setLists([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Sync (Tasks & Lists)
  useEffect(() => {
    if (!user) return;

    // IMPORTANT: Path must match /artifacts/{appId}/users/{userId}/...
    // where userId is the actual Authenticated UID.
    
    // Listen to Lists
    const qLists = query(collection(db, 'artifacts', appId, 'users', user.id, 'lists'));
    const unsubLists = onSnapshot(qLists, (snapshot) => {
      const fetchedLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToDoList))
        .sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setLists(fetchedLists);
    }, (error) => console.error("Error fetching lists:", error));

    // Listen to Tasks
    const qTasks = query(collection(db, 'artifacts', appId, 'users', user.id, 'tasks'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now() // Handle server timestamp
        } as Task;
      });
      setTasks(fetchedTasks);
    }, (error) => console.error("Error fetching tasks:", error));

    return () => {
      unsubLists();
      unsubTasks();
    };
  }, [user]);

  // Derived State
  const visibleSystemLists = systemLists.filter(list => {
    if (list.id === 'my-day' || list.id === 'tasks') return true; // Always visible
    return smartListsVisibility[list.id as keyof typeof smartListsVisibility];
  });

  const activeList = [...visibleSystemLists, ...lists].find(l => l.id === activeListId) || visibleSystemLists[0];
   
  // Determine default target list when switching main lists
  useEffect(() => {
    let targetId = 'tasks';
    const isSystem = systemLists.some(sl => sl.id === activeListId);
    if (!isSystem && activeListId) {
        const currentList = lists.find(l => l.id === activeListId);
        if (currentList && currentList.type !== 'folder') {
            targetId = activeListId;
        }
    }
    setNewTaskMetadata(prev => ({ ...prev, targetListId: targetId }));
  }, [activeListId, lists]);

  // Handle Click Outside Input
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setIsInputFocused(false);
        setActiveInputPopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    switch(activeListId) {
      case 'my-day': return t.addedToMyDay;
      case 'important': return t.isImportant;
      case 'planned': return t.dueDate;
      case 'assigned': return false;
      case 'all': return true;
      case 'completed': return t.isCompleted;
      case 'overdue': 
        if (!t.dueDate || t.isCompleted) return false;
        const due = new Date(t.dueDate);
        due.setHours(23, 59, 59, 999);
        return due < new Date();
      case 'addedToMyDay': return t.addedToMyDay;
      case 'uncompleted': return !t.isCompleted;
      case 'tasks': return t.listId === 'tasks' || !t.listId;
      default: return t.listId === activeListId;
    }
  });

  // Sort Tasks
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'importance':
          return (a.isImportant === b.isImportant) ? 0 : a.isImportant ? -1 : 1;
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case 'creation':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  };

  const activeTasks = sortTasks(filteredTasks.filter(t => !t.isCompleted));
  const completedTasks = sortTasks(filteredTasks.filter(t => t.isCompleted));
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Suggestions Logic
  const getSuggestions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const candidates = tasks.filter(t => !t.addedToMyDay && !t.isCompleted);
    
    const overdue = candidates.filter(t => t.dueDate && new Date(t.dueDate) < today);
    const dueToday = candidates.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
    });
    
    const others = candidates.filter(t => !overdue.includes(t) && !dueToday.includes(t));

    return { overdue, dueToday, others };
  };

  const suggestions = getSuggestions();

  // --- Effects ---
  useEffect(() => {
    setIsHeaderMenuOpen(false);
    setActiveSubMenu(null);
    if (activeListId === 'my-day') setCurrentTheme(themes[0]); 
  }, [activeListId]);

  useEffect(() => {
    if (pinnedMessage) {
      const timer = setTimeout(() => setPinnedMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pinnedMessage]);

  // --- Actions ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPass) return;
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPass);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
      }
      localStorage.removeItem('current_active_email');
    } catch (error: any) {
      console.warn("Login real falló, activando modo persistencia local para:", authEmail);
      
      try {
        localStorage.setItem('current_active_email', authEmail);
        
        // Limpiamos sesión previa para forzar re-evaluación del usuario
        if (auth.currentUser) await signOut(auth);
        
        await signInAnonymously(auth); 
      } catch (innerError: any) {
        setAuthError("No se pudo iniciar sesión (ni real ni local).");
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      const guestIdentifier = "Invitado";
      localStorage.setItem('current_active_email', guestIdentifier);
      
      if (auth.currentUser) await signOut(auth);
      
      await signInAnonymously(auth);
    } catch (error: any) {
      setAuthError(error.message || "Error al iniciar como invitado");
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      localStorage.removeItem('current_active_email');
    } catch (error: any) {
      console.log("Google Auth failed, switching to fallback:", error);
      
      // --- FALLBACK INCONDICIONAL ---
      // Si falla por CUALQUIER motivo (popup bloqueado, dominio, error de red), activamos el modo manual.
      
      let emailToUse = authEmail.trim();

      if (!emailToUse) {
          // Default solicitado por el usuario
          const defaultEmail = "legumbres65@gmail.com"; 
          const promptEmail = window.prompt("No se pudo conectar con Google (Entorno de prueba).\n\nIngresa el correo que quieres simular:", defaultEmail);
          
          if (promptEmail === null) return; // Cancelado
          emailToUse = promptEmail || defaultEmail;
      }

      try {
        // 1. Guardar estado
        localStorage.setItem('current_active_email', emailToUse);
        
        // 2. Asegurar sesión anónima
        // Si ya estamos logueados (incluso anónimamente), cerramos para reiniciar el flujo limpio
        if (auth.currentUser) {
            await signOut(auth);
        }
        
        // 3. Iniciar sesión anónima (esto disparará onAuthStateChanged)
        await signInAnonymously(auth);

      } catch(e) {
           console.error(e);
           setAuthError("Error al iniciar sesión simulada.");
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('current_active_email'); 
    await signOut(auth);
    setIsManageAccountsOpen(false);
  };

  // --- New Logic for Account Switching ---
  const handleAddAccount = async () => {
    localStorage.removeItem('current_active_email');
    await signOut(auth);
    setAuthEmail('');
    setAuthPass('');
    setIsManageAccountsOpen(false);
  };

  const handleSwitchAccount = async (targetUser: User) => {
      if (user && targetUser.id === user.id) return; 
      
      localStorage.setItem('current_active_email', targetUser.email);
      
      await signOut(auth);
      await signInAnonymously(auth);
      
      setIsManageAccountsOpen(false);
  };
  // ----------------------------------------

  const addTask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTaskTitle.trim() && user) {
      const newTask = {
        title: newTaskTitle,
        isCompleted: false,
        isImportant: activeListId === 'important',
        addedToMyDay: activeListId === 'my-day',
        listId: newTaskMetadata.targetListId,
        createdAt: serverTimestamp(),
        dueDate: newTaskMetadata.dueDate ? newTaskMetadata.dueDate.toISOString() : null,
        reminderAt: newTaskMetadata.reminder || null,
        repeat: newTaskMetadata.repeat || null
      };
      
      await addDoc(collection(db, 'artifacts', appId, 'users', user.id, 'tasks'), newTask);
      
      setNewTaskTitle('');
      setNewTaskMetadata(prev => ({ 
        dueDate: null, 
        reminder: null, 
        repeat: null, 
        targetListId: ['my-day', 'important', 'planned', 'assigned'].includes(activeListId) ? 'tasks' : activeListId 
      }));
    }
  };

  const setInputDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setNewTaskMetadata(prev => ({ ...prev, dueDate: d }));
    setActiveInputPopover(null);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.id, 'tasks', taskId), {
        isCompleted: !task.isCompleted
      });
    }
  };

  const toggleTaskImportance = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.id, 'tasks', taskId), {
        isImportant: !task.isImportant
      });
    }
  };

  const toggleMyDay = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.id, 'tasks', taskId), {
        addedToMyDay: !task.addedToMyDay
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.id, 'tasks', taskId), updates);
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('¿Eliminar tarea permanentemente?')) {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.id, 'tasks', taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    }
  };

  const openCreationModal = (type: 'list' | 'folder') => {
    setCreationModal({ isOpen: true, type });
    setCreationName('');
  };

  const handleCreateConfirm = async () => {
    if (!creationName.trim() || !user) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'users', user.id, 'lists'), {
      title: creationName,
      type: creationModal.type,
      createdAt: serverTimestamp()
    });

    setCreationModal({ ...creationModal, isOpen: false });
  };

  const handlePrint = () => {
    setIsHeaderMenuOpen(false);
    window.print();
  };

  const handleEmail = () => {
    setIsHeaderMenuOpen(false);
    const subject = encodeURIComponent(`Lista de tareas: ${activeList?.title}`);
    const body = activeTasks.map(t => `- ${t.isImportant ? '[!]' : ''} ${t.title}`).join('\n');
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`);
  };

  const handlePin = () => {
    setIsHeaderMenuOpen(false);
    setPinnedMessage(`"${activeList?.title}" anclado a Inicio`);
  };

  const toggleSmartList = (key: keyof typeof smartListsVisibility) => {
    setSmartListsVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSuggestions = () => {
    if (!isSuggestionsOpen) {
        setSelectedTaskId(null); 
    }
    setIsSuggestionsOpen(!isSuggestionsOpen);
  };

  // --- Render Helpers ---

  const getListIcon = (iconName?: string, className?: string) => {
    const props = { className: className || "w-5 h-5" };
    switch (iconName) {
      case 'Sun': return <Sun {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Calendar': return <Calendar {...props} />;
      case 'User': return <UserIcon {...props} />;
      case 'Home': return <Home {...props} />;
      case 'AlertCircle': return <AlertCircle {...props} />;
      case 'PlusCircle': return <PlusCircle {...props} />;
      case 'Circle': return <Circle {...props} />;
      case 'Infinity': return <Infinity {...props} />;
      case 'CheckCircle2': return <CheckCircle2 {...props} />;
      case 'MoreHorizontal': return <MoreHorizontal {...props} />;
      default: return <ListIcon {...props} />;
    }
  };

  const getTargetListName = () => {
      const l = [...systemLists, ...lists].find(l => l.id === newTaskMetadata.targetListId);
      return l ? l.title : 'Tareas';
  };

  const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- Views ---

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1F1F] bg-opacity-95 backdrop-blur-sm">
        <div className="bg-[#2D2D2D] p-8 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700 text-center relative overflow-hidden">
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 bg-[#5CA5F3] rounded-lg flex items-center justify-center shadow-lg">
              <Check className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-white tracking-tight">{isRegistering ? 'Crear Cuenta' : 'Microsoft To Do'}</h1>
          <p className="text-[#A0A0A0] text-sm mb-6">Inicia sesión para sincronizar</p>

          {authError && <div className="bg-red-900/50 text-red-200 text-xs p-2 mb-4 rounded border border-red-800">{String(authError)}</div>}

          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <div>
              <label className="text-xs text-[#A0A0A0] font-semibold ml-1">Correo electrónico</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="nombre@ejemplo.com" 
                className="w-full bg-[#292929] text-white border border-gray-600 rounded p-2.5 mt-1 focus:outline-none focus:border-[#5CA5F3] focus:ring-1 focus:ring-[#5CA5F3] transition placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-[#A0A0A0] font-semibold ml-1">Contraseña</label>
              <input 
                type="password" 
                value={authPass}
                onChange={e => setAuthPass(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#292929] text-white border border-gray-600 rounded p-2.5 mt-1 focus:outline-none focus:border-[#5CA5F3] focus:ring-1 focus:ring-[#5CA5F3] transition placeholder-gray-500"
              />
            </div>
            <button type="submit" className="w-full bg-[#5CA5F3] hover:bg-blue-500 text-white font-medium py-2.5 rounded transition shadow-lg mt-2">
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="px-3 text-xs text-gray-400">O continúa con</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          <button onClick={handleGoogleLogin} className="w-full bg-white text-gray-800 hover:bg-gray-100 font-medium py-2.5 rounded transition mb-3 flex items-center justify-center gap-2">
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
             </svg>
             Continuar con Google
          </button>

          <button onClick={handleGuestLogin} className="w-full bg-transparent border border-gray-600 hover:bg-gray-700/50 text-gray-300 text-sm font-medium py-2.5 rounded transition mb-4">
            Continuar como Invitado
          </button>
          
          <p className="text-xs text-gray-400">
            {isRegistering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#5CA5F3] hover:underline">
              {isRegistering ? 'Inicia sesión' : 'Regístrate aquí'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Toast Notification */}
      {pinnedMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#333] text-white px-4 py-2 rounded shadow-xl z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm">{pinnedMessage}</span>
        </div>
      )}

      {/* MANAGE ACCOUNTS MODAL */}
      {isManageAccountsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2D2D2D] rounded-lg shadow-2xl w-[400px] border border-gray-700 overflow-hidden transform scale-100 transition-all">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Administrar cuentas</h2>
              
              {/* Account List */}
              <div className="space-y-4 mb-6">
                {savedAccounts.map((acc) => (
                    <div 
                      key={acc.id} 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${acc.id === user.id ? 'bg-[#363636] border border-gray-600' : 'hover:bg-[#363636] border border-transparent'}`}
                      onClick={() => handleSwitchAccount(acc)}
                    >
                      <div className="flex items-center gap-3">
                        <img src={acc.avatar} className="w-10 h-10 rounded-full bg-purple-600 object-cover border border-gray-600" alt="Avatar" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{acc.name} {acc.id === user.id && '(Actual)'}</p>
                          <p className="text-xs text-[#A0A0A0] truncate">{acc.email}</p>
                        </div>
                      </div>
                      {acc.id === user.id && <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 px-2 py-1">Salir</button>}
                    </div>
                ))}
              </div>

              {/* Add Account Option - FIXED */}
              <button 
                className="w-full flex items-center gap-3 p-3 hover:bg-[#363636] rounded transition text-[#A0A0A0] hover:text-white mb-6"
                onClick={handleAddAccount}
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="font-medium">Agregar cuenta</span>
                    <span className="text-xs text-gray-500">Inicia sesión con otra cuenta</span>
                </div>
              </button>

              {/* Close Button */}
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsManageAccountsOpen(false)}
                  className="px-6 py-2 bg-[#363636] hover:bg-[#444] text-white rounded transition text-sm font-medium border border-gray-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATION MODAL */}
      {creationModal.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2D2D2D] p-6 rounded-lg shadow-2xl w-80 border border-gray-700 transform scale-100 transition-all">
            <h3 className="text-white font-semibold mb-4 text-lg">
              {creationModal.type === 'list' ? 'Nueva lista' : 'Nueva carpeta'}
            </h3>
            <input 
              autoFocus
              type="text" 
              value={creationName}
              onChange={(e) => setCreationName(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleCreateConfirm(); }}
              placeholder={creationModal.type === 'list' ? "Nombre de la lista" : "Nombre de la carpeta"} 
              className="w-full bg-[#1F1F1F] text-white border-b-2 border-[#5CA5F3] p-2 focus:outline-none mb-6 placeholder-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setCreationModal({ ...creationModal, isOpen: false })} 
                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm font-medium transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateConfirm} 
                className="px-4 py-2 bg-[#5CA5F3] text-white rounded hover:bg-blue-600 text-sm font-medium transition shadow-lg"
              >
                Crear {creationModal.type === 'list' ? 'lista' : 'carpeta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL / OVERLAY */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-[#1F1F1F] text-[#EAEAEA] overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-2xl mx-auto px-6 py-8">
            {/* ... Settings Content ... */}
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setIsSettingsOpen(false)} className="hover:bg-[#363636] p-2 rounded-full transition">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <h1 className="text-2xl font-semibold text-white">Configuración</h1>
            </div>

            <div className="space-y-10">
              {/* General Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-[#A0A0A0] mb-4">General</h2>
                <ToggleRow label="Agregar nuevas tareas en parte superior" defaultChecked={true} />
                <ToggleRow label="Mover tareas marcadas con estrella hacia arriba" defaultChecked={true} />
                <ToggleRow label="Reproducir sonido de finalización" defaultChecked={true} />
                <ToggleRow label="Confirmar antes de eliminar" defaultChecked={true} />
                <ToggleRow label="Inicio automático de To Do con el inicio de Windows" defaultChecked={false} />
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#A0A0A0]">Inicio de la semana</label>
                  <select defaultValue="Predeterminado del sistema" className="bg-[#2D2D2D] border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5CA5F3]">
                    <option>Predeterminado del sistema</option>
                    <option>Domingo</option>
                    <option>Lunes</option>
                    <option>Martes</option>
                    <option>Miércoles</option>
                    <option>Jueves</option>
                    <option>Viernes</option>
                    <option>Sábado</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#A0A0A0]">Notificación de la aplicación</label>
                  <select defaultValue="Vencimiento hoy y vencido" className="bg-[#2D2D2D] border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#5CA5F3]">
                    <option>Vencimiento hoy y vencido</option>
                    <option>Se agregaron a Mi día y no se complementaron</option>
                    <option>Desactivado</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-[#A0A0A0] mb-2">Puedes anclar esta aplicación a la barra de tareas para tener acceso rápido</p>
                  <button className="bg-[#5CA5F3] hover:bg-blue-600 text-black font-medium px-4 py-2 rounded text-sm transition">
                    Anclar a la barra de tareas
                  </button>
                  <button className="block text-[#5CA5F3] text-sm mt-3 hover:underline">Métodos abreviados de teclado</button>
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Theme Section */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Tema</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="theme" className="w-5 h-5 accent-[#5CA5F3] bg-transparent border-gray-500" />
                    <span>Tema claro</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="theme" className="w-5 h-5 accent-[#5CA5F3] bg-transparent border-gray-500" />
                    <span>Tema oscuro</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="theme" defaultChecked className="w-5 h-5 accent-[#5CA5F3] bg-transparent border-gray-500" />
                    <span>Usar mi tema del sistema</span>
                  </label>
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Smart Lists Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Listas inteligentes</h2>
                <div className="space-y-4">
                  <SmartListToggle label="Importante" icon={Star} checked={smartListsVisibility.important} onChange={() => toggleSmartList('important')} />
                  <SmartListToggle label="Planeado" icon={Calendar} checked={smartListsVisibility.planned} onChange={() => toggleSmartList('planned')} />
                  <SmartListToggle label="Completadas" icon={CheckCircle2} checked={smartListsVisibility.completed} onChange={() => toggleSmartList('completed')} />
                  <SmartListToggle label="Todo" icon={Infinity} checked={smartListsVisibility.all} onChange={() => toggleSmartList('all')} />
                  <SmartListToggle label="Asignadas a mi usuario" icon={UserIcon} checked={smartListsVisibility.assigned} onChange={() => toggleSmartList('assigned')} />
                  <SmartListToggle label="Vencimiento hoy y vencido" icon={AlertCircle} checked={smartListsVisibility.overdue} onChange={() => toggleSmartList('overdue')} />
                  <SmartListToggle label="Se agregaron a Mi día" icon={PlusCircle} checked={smartListsVisibility.addedToMyDay} onChange={() => toggleSmartList('addedToMyDay')} />
                  <SmartListToggle label="No se completaron" icon={Circle} checked={smartListsVisibility.uncompleted} onChange={() => toggleSmartList('uncompleted')} />
                </div>
                <ToggleRow label="Ocultar automáticamente las listas inteligentes vacías" defaultChecked={false} />
                <ToggleRow label="Mostrar tareas de 'Vencimiento hoy' en Mi día" defaultChecked={true} />
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Connected Apps Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Aplicaciones conectadas</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LayoutList className="w-6 h-6 text-[#5CA5F3]" />
                    <div>
                      <p className="font-medium">Planner</p>
                      <p className="text-sm text-[#A0A0A0]">Tareas asignadas a ti en Planner</p>
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked={true} />
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Notifications Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Notificaciones</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Avisos</span>
                    <ToggleSwitch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Actividad de lista compartida</span>
                    <ToggleSwitch defaultChecked={true} />
                  </div>
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Help & Feedback Section */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Ayuda y comentarios</h2>
                <p className="text-sm">Todo está sincronizado. ¡Vamos!</p>
                <button className="bg-[#5CA5F3] hover:bg-blue-600 text-black font-medium px-4 py-2 rounded text-sm transition flex items-center gap-2 w-fit">
                  <RefreshCw className="w-4 h-4" /> Sincronizar
                </button>
                <div className="flex flex-col gap-2 mt-2">
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Más información</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Sugerir una característica</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Valórenos</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Copiar id. de sesión y usuario</button>
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* Connect Section */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Conectar</h2>
                <div className="flex flex-col gap-3">
                  <button className="flex items-center gap-2 text-[#5CA5F3] hover:underline text-sm">
                    <Twitter className="w-5 h-5" /> Síguenos en Twitter
                  </button>
                  <button className="flex items-center gap-2 text-[#5CA5F3] hover:underline text-sm">
                    <Facebook className="w-5 h-5" /> Síguenos en Facebook
                  </button>
                  <button className="flex items-center gap-2 text-[#5CA5F3] hover:underline text-sm">
                    <Heart className="w-5 h-5 fill-current" /> Recomiéndaselo a tus amigos.
                  </button>
                </div>
              </section>
              <div className="h-px bg-gray-700"></div>
              {/* About Section */}
              <section className="space-y-6 pb-12">
                <h2 className="text-xl font-semibold text-[#A0A0A0]">Acerca de</h2>
                <div className="flex flex-col gap-2">
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Privacidad</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Exportar tu información</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Términos de licencia del software de Microsoft</button>
                  <button className="text-[#5CA5F3] hover:underline text-left text-sm">Avisos de terceros</button>
                </div>
                <div className="space-y-4 mt-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Enviar datos de diagnóstico necesarios</span>
                      <ToggleSwitch defaultChecked={true} />
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">
                      Recopilamos los datos de diagnóstico necesarios para mantener To Do seguro, actualizado y funcionando según lo previsto en los dispositivos en los que está instalado. Por ejemplo, qué sistema operativo usa y si las actualizaciones se instalan correctamente.
                      <br/>
                      <span className="text-[#5CA5F3] cursor-pointer hover:underline">Más información sobre los datos de diagnóstico</span>
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Enviar datos de diagnóstico opcionales</span>
                      <ToggleSwitch defaultChecked={false} />
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">
                      Nos gustaría que nos enviara datos de uso y diagnóstico adicionales. Así es como seguimos mejorando. Ninguno de estos datos incluye su nombre, contenido de archivo o información sobre aplicaciones no relacionadas con To Do.
                      <br/>
                      <span className="text-[#5CA5F3] cursor-pointer hover:underline">Obtener más información sobre los datos de diagnóstico opcionales</span>
                    </p>
                  </div>
                </div>
                <div className="mt-8 text-xs text-[#A0A0A0]">
                  <p className="font-semibold text-white mb-1">Microsoft To Do</p>
                  <p>© 2025 Microsoft. Todos los derechos reservados</p>
                  <p>2.148.3611.0</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside 
        className={`w-[290px] bg-[#1F1F1F] flex flex-col flex-shrink-0 z-50 shadow-2xl md:shadow-none absolute h-full md:relative transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* User Profile */}
        <div className="relative">
          <div 
            className="px-4 pt-4 pb-2 flex items-center gap-3 hover:bg-[#2D2D2D] cursor-pointer mx-2 mt-2 rounded group" 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <img src={user.avatar} className="w-8 h-8 rounded-full bg-purple-600 object-cover border border-gray-600" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-white transition">{user.name}</p>
              <p className="text-xs text-[#A0A0A0] truncate">{user.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A0A0A0] opacity-0 group-hover:opacity-100 transition" />
          </div>

          {/* USER MENU DROPDOWN */}
          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
              <div className="absolute left-4 top-16 w-64 bg-[#2D2D2D] rounded-lg shadow-xl border border-black/50 z-50 py-1 text-sm text-[#EAEAEA] animate-in fade-in zoom-in-95 duration-100">
                {/* 1. Administrar cuentas */}
                <button 
                  onClick={() => { setIsManageAccountsOpen(true); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-[#363636] flex items-center gap-3"
                >
                  <UserCog className="w-4 h-4 text-[#A0A0A0]" />
                  <span>Administrar cuentas</span>
                </button>
                 
                {/* 2. Ajustes */}
                <button 
                  onClick={() => { setIsSettingsOpen(true); setIsUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-[#363636] flex items-center gap-3"
                >
                  <Settings className="w-4 h-4 text-[#A0A0A0]" />
                  <span>Ajustes</span>
                </button>
                 
                {/* 3. Sincronizar */}
                <button 
                  onClick={() => alert("Sincronizando...")}
                  className="w-full text-left px-4 py-3 hover:bg-[#363636] flex items-center gap-3"
                >
                  <RefreshCw className="w-4 h-4 text-[#A0A0A0]" />
                  <span>Sincronizar</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative group">
            <input type="text" placeholder="Buscar" className="w-full bg-[#2D2D2D] text-sm text-white placeholder-gray-400 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5CA5F3] border border-transparent group-hover:bg-[#363636] transition" />
            <Search className="w-4 h-4 text-[#5CA5F3] absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
          {visibleSystemLists.map(list => {
             const count = tasks.filter(t => {
                // ... same count logic ...
                if (list.id === 'my-day') return t.addedToMyDay && !t.isCompleted;
                if (list.id === 'important') return t.isImportant && !t.isCompleted;
                if (list.id === 'planned') return t.dueDate && !t.isCompleted;
                if (list.id === 'tasks') return (!t.listId || t.listId === 'tasks') && !t.isCompleted;
                if (list.id === 'overdue') return t.dueDate && new Date(t.dueDate) < new Date() && !t.isCompleted;
                if (list.id === 'uncompleted') return !t.isCompleted;
                if (list.id === 'addedToMyDay') return t.addedToMyDay;
                if (list.id === 'all') return true;
                if (list.id === 'completed') return t.isCompleted;
                return false;
             }).length;
             
             return (
              <div 
                key={list.id}
                onClick={() => { setActiveListId(list.id); setIsSidebarOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition group ${activeListId === list.id ? 'bg-[#2D2D2D] border-l-2 border-[#5CA5F3]' : 'hover:bg-[#2D2D2D] border-l-2 border-transparent text-gray-300'}`}
              >
                <div className="flex items-center gap-3">
                  {getListIcon(list.icon, `w-5 h-5 font-light transition-colors ${activeListId === list.id ? 'text-[#5CA5F3]' : 'text-gray-400 group-hover:text-white'}`)}
                  <span className={`text-sm ${activeListId === list.id ? 'text-white font-medium' : ''}`}>{list.title}</span>
                </div>
                {count > 0 && <span className="text-xs text-gray-500 font-light group-hover:text-gray-300 transition">{count}</span>}
              </div>
            );
          })}

          <div className="h-px bg-gray-700 mx-4 my-3"></div>

          {lists.map(list => {
            const count = tasks.filter(t => t.listId === list.id && !t.isCompleted).length;
            return (
              <div 
                key={list.id}
                onClick={() => { 
                    if (list.type !== 'folder') {
                        setActiveListId(list.id); 
                        setIsSidebarOpen(false); 
                    }
                }}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition group ${activeListId === list.id ? 'bg-[#2D2D2D] border-l-2 border-[#5CA5F3]' : 'hover:bg-[#2D2D2D] border-l-2 border-transparent text-gray-300'}`}
              >
                <div className="flex items-center gap-3">
                  {list.type === 'folder' ? (
                      <Folder className={`w-5 h-5 transition-colors ${activeListId === list.id ? 'text-[#5CA5F3]' : 'text-gray-400 group-hover:text-white'}`} />
                  ) : (
                      <ListIcon className={`w-5 h-5 transition-colors ${activeListId === list.id ? 'text-[#5CA5F3]' : 'text-[#5CA5F3] group-hover:text-white'}`} />
                  )}
                  <span className={`text-sm ${activeListId === list.id ? 'text-white font-medium' : ''}`}>{list.title}</span>
                </div>
                {list.type !== 'folder' && count > 0 && <span className="text-xs text-gray-500 font-light group-hover:text-gray-300 transition">{count}</span>}
              </div>
            );
          })}
        </nav>

        {/* Footer - Updated to trigger custom Modal */}
        <div className="p-2 border-t border-gray-800 flex items-center">
          <button onClick={() => openCreationModal('list')} className="flex-1 flex items-center gap-3 text-[#5CA5F3] hover:bg-[#2D2D2D] px-4 py-3 rounded transition">
            <Plus className="w-5 h-5" />
            <span className="font-medium text-base">Nueva lista</span>
          </button>
          <button 
            onClick={() => openCreationModal('folder')}
            className="p-3 text-[#EAEAEA] hover:bg-[#2D2D2D] rounded transition ml-1"
            title="Crear carpeta"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* ... MAIN and RIGHT SIDEBAR (kept as is) ... */}
      <main 
        className="flex-1 relative flex flex-col transition-all duration-500"
        style={{ 
          backgroundColor: currentTheme.color || '#111111',
          backgroundImage: currentTheme.url ? `url('${currentTheme.url}')` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* ... (Same as before) ... */}
        {/* Overlay for backgrounds to ensure text readability */}
        {currentTheme.url && <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>}

        {/* Mobile Menu Button */}
        <div className="md:hidden absolute top-4 left-4 z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white drop-shadow-md p-2 rounded hover:bg-black/20">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Header */}
        <header className="relative z-40 px-8 pt-8 pb-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold drop-shadow-lg tracking-wide">{activeList?.title || 'Tareas'}</h2>
              {activeListId === 'my-day' && <p className="text-white/90 text-sm drop-shadow-md mt-1">{todayDate}</p>}
            </div>
            
            <div className="flex items-center gap-2">
                {/* Suggestions Button */}
                <button 
                    className={`p-2 hover:bg-white/10 rounded transition ${isSuggestionsOpen ? 'bg-white/10' : ''}`}
                    onClick={toggleSuggestions}
                    title="Sugerencias"
                >
                    <Lightbulb className="w-5 h-5" />
                </button>

                {/* Header Options Menu */}
                <div className="relative">
                  <button 
                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                    className={`p-2 hover:bg-white/10 rounded transition ${isHeaderMenuOpen ? 'bg-white/10' : ''}`}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isHeaderMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setIsHeaderMenuOpen(false); setActiveSubMenu(null); }}></div>
                      <div className="absolute right-0 top-10 w-72 bg-[#2D2D2D] rounded-lg shadow-xl border border-black/50 z-50 py-2 text-sm text-[#EAEAEA] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        
                        {/* Theme Picker */}
                        <div className="px-4 py-3 border-b border-gray-700">
                          <div className="flex items-center gap-2 mb-2 text-[#A0A0A0] text-xs font-semibold uppercase tracking-wider">
                            <Palette className="w-3.5 h-3.5" />
                            <span>Tema</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {themes.map(theme => (
                               <button 
                                key={theme.id}
                                onClick={() => setCurrentTheme(theme)}
                                className={`w-8 h-8 rounded-full border-2 transition-all overflow-hidden relative ${currentTheme.id === theme.id ? 'border-[#5CA5F3] scale-110' : 'border-transparent hover:border-gray-500'}`}
                                style={{ background: theme.color || `url(${theme.url}) center/cover` }}
                               >
                               </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="py-1 border-b border-gray-700">
                           {/* Sort Option with Hover Submenu */}
                          <div 
                            className="relative"
                            onMouseEnter={() => setActiveSubMenu('sort')}
                            onMouseLeave={() => setActiveSubMenu(null)}
                          >
                            <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <ArrowUpDown className="w-4 h-4 text-[#A0A0A0]" />
                                <span>Ordenar por</span>
                              </div>
                              <ChevronRightIcon className="w-4 h-4 text-[#A0A0A0]" />
                            </button>

                            {/* Submenu */}
                            {activeSubMenu === 'sort' && (
                              <div className="absolute right-full top-0 mr-1 w-56 bg-[#2D2D2D] rounded-lg shadow-xl border border-black/50 z-50 py-1 overflow-hidden">
                                 {[
                                   { id: 'importance', label: 'Importancia' },
                                   { id: 'dueDate', label: 'Fecha de vencimiento' },
                                   { id: 'creation', label: 'Fecha de creación' },
                                   { id: 'alphabetical', label: 'Alfabéticamente' } 
                                 ].map(opt => (
                                   <button 
                                     key={opt.id}
                                     onClick={() => { setSortOption(opt.id as SortOption); setIsHeaderMenuOpen(false); }}
                                     className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center justify-between group"
                                   >
                                     <span>{opt.label}</span>
                                     {sortOption === opt.id && <Check className="w-4 h-4 text-[#5CA5F3]" />}
                                   </button>
                                 ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="py-1">
                          <button onClick={handlePrint} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-3">
                            <Printer className="w-4 h-4 text-[#A0A0A0]" /> Imprimir lista
                          </button>
                          <button onClick={handleEmail} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[#A0A0A0]" /> Enviar por correo
                          </button>
                          <button onClick={handlePin} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-3">
                            <Pin className="w-4 h-4 text-[#A0A0A0]" /> Anclar a Inicio
                          </button>
                        </div>

                      </div>
                    </>
                  )}
                </div>
            </div>
          </div>
        </header>

        {/* Tasks List */}
        <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-32 custom-scrollbar">
          <div className="space-y-0.5">
            {activeTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTaskId(task.id)}
                onToggleComplete={() => toggleTaskCompletion(task.id)}
                onToggleImportant={(e) => toggleTaskImportance(task.id, e)}
                listName={lists.find(l => l.id === task.listId)?.title}
              />
            ))}
          </div>

          {completedTasks.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 bg-black/40 text-white/90 px-3 py-1.5 rounded text-sm font-medium hover:bg-black/60 transition mb-2">
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`} />
                Completado <span className="ml-1 opacity-75">{completedTasks.length}</span>
              </button>
              {showCompleted && (
                 <div className="space-y-0.5 opacity-90">
                    {completedTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        isSelected={selectedTaskId === task.id}
                        onSelect={() => setSelectedTaskId(task.id)}
                        onToggleComplete={() => toggleTaskCompletion(task.id)}
                        onToggleImportant={(e) => toggleTaskImportance(task.id, e)}
                        listName={lists.find(l => l.id === task.listId)?.title}
                      />
                    ))}
                 </div>
              )}
            </div>
          )}
        </div>

        {/* --- SMART INPUT AREA --- */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/60 to-transparent">
          <div ref={inputContainerRef} className={`bg-[#252525] bg-opacity-95 backdrop-blur-sm rounded-md shadow-lg border border-gray-700/50 ring-1 ring-white/5 transition-all duration-300 ${isInputFocused ? 'ring-[#5CA5F3] shadow-2xl' : ''}`}>
            
            {/* Unified Input Row - Everything in one line */}
            <div className="flex items-center px-4 py-3 gap-2">
              <Plus className={`w-6 h-6 flex-shrink-0 transition-colors ${isInputFocused ? 'text-white' : 'text-[#5CA5F3]'}`} />
              
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onKeyDown={addTask}
                placeholder="Agregar una tarea" 
                className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none text-[15px] min-w-0"
              />

              {/* Extra Options (Shown on Focus) - Now inline */}
              {isInputFocused && (
                <div className="flex items-center gap-1 text-[#A0A0A0] flex-shrink-0 animate-in fade-in duration-200">
                  
                  {/* Date Picker Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveInputPopover(activeInputPopover === 'date' ? null : 'date')}
                      className={`p-2 hover:bg-gray-700 rounded transition relative ${newTaskMetadata.dueDate ? 'text-[#5CA5F3]' : ''}`}
                    >
                      <Calendar className="w-5 h-5" />
                      {newTaskMetadata.dueDate && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#5CA5F3] rounded-full"></div>}
                    </button>
                    {/* Date Popover */}
                    {activeInputPopover === 'date' && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#2D2D2D] border border-gray-700 rounded-lg shadow-xl py-1 z-50 text-sm text-[#EAEAEA]">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 mb-1">Vencimiento</div>
                          <button onClick={() => setInputDate(0)} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center justify-between">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-green-400"/> Hoy</span>
                            <span className="text-gray-500 text-xs">Jue</span>
                          </button>
                          <button onClick={() => setInputDate(1)} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center justify-between">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-400"/> Mañana</span>
                            <span className="text-gray-500 text-xs">Vie</span>
                          </button>
                          <button onClick={() => setInputDate(7)} className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center justify-between">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400"/> Semana sig.</span>
                            <span className="text-gray-500 text-xs">Lun</span>
                          </button>
                          <div className="border-t border-gray-700 mt-1 pt-1">
                             <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400"/> Elegir fecha
                             </button>
                          </div>
                      </div>
                    )}
                  </div>

                  {/* Reminder Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveInputPopover(activeInputPopover === 'reminder' ? null : 'reminder')}
                      className="p-2 hover:bg-gray-700 rounded transition"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                      {/* Reminder Popover */}
                      {activeInputPopover === 'reminder' && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#2D2D2D] border border-gray-700 rounded-lg shadow-xl py-1 z-50 text-sm text-[#EAEAEA]">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 mb-1">Recordatorio</div>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Clock className="w-4 h-4"/> Más tarde hoy (18:00)
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Clock className="w-4 h-4"/> Mañana (09:00)
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Clock className="w-4 h-4"/> Semana siguiente (09:00)
                          </button>
                      </div>
                    )}
                  </div>

                  {/* Repeat Button */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveInputPopover(activeInputPopover === 'repeat' ? null : 'repeat')}
                      className="p-2 hover:bg-gray-700 rounded transition"
                    >
                      <Repeat className="w-5 h-5" />
                    </button>
                      {/* Repeat Popover */}
                      {activeInputPopover === 'repeat' && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#2D2D2D] border border-gray-700 rounded-lg shadow-xl py-1 z-50 text-sm text-[#EAEAEA]">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 mb-1">Repetir</div>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Repeat className="w-4 h-4"/> Diariamente
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Repeat className="w-4 h-4"/> Semanalmente
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Repeat className="w-4 h-4"/> Mensualmente
                          </button>
                          <button className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2">
                            <Repeat className="w-4 h-4"/> Anualmente
                          </button>
                      </div>
                    )}
                  </div>

                   {/* List Selector */}
                  <div className="relative ml-2">
                    <button 
                      onClick={() => setActiveInputPopover(activeInputPopover === 'list' ? null : 'list')}
                      className="flex items-center gap-2 text-xs text-[#EAEAEA] hover:bg-gray-700 px-2 py-1.5 rounded transition bg-gray-800 border border-gray-600"
                    >
                      <span className="whitespace-nowrap max-w-[100px] truncate">{getTargetListName()}</span>
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    </button>
                    
                    {/* List Popover */}
                      {activeInputPopover === 'list' && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#2D2D2D] border border-gray-700 rounded-lg shadow-xl py-1 z-50 text-sm text-[#EAEAEA] max-h-60 overflow-y-auto custom-scrollbar">
                           <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700 mb-1">Guardar en</div>
                           <button 
                              onClick={() => { setNewTaskMetadata(p => ({...p, targetListId: 'tasks'})); setActiveInputPopover(null); }}
                              className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2"
                           >
                              <Home className="w-4 h-4 text-[#5CA5F3]"/> Tareas
                           </button>
                           {lists.map(l => (
                              <button 
                                  key={l.id}
                                  onClick={() => { setNewTaskMetadata(p => ({...p, targetListId: l.id})); setActiveInputPopover(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-[#363636] flex items-center gap-2"
                              >
                                  <ListIcon className="w-4 h-4 text-[#5CA5F3]"/> {l.title}
                              </button>
                           ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL AREA - SUGGESTIONS OR DETAILS */}
      {(isSuggestionsOpen || selectedTask) && (
        <aside className="w-[360px] bg-[#252525] border-l border-black flex flex-col shadow-2xl z-30 absolute right-0 h-full md:static md:border-l-gray-800 transition-all">
            {isSuggestionsOpen ? (
                // --- SUGGESTIONS PANEL ---
                <>
                    <div className="p-6 pb-2 border-b border-gray-800">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-xl font-bold text-white">Sugerencias</h2>
                            <button onClick={() => setIsSuggestionsOpen(false)} className="hover:bg-[#363636] p-2 rounded transition"><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <p className="text-sm text-gray-400">Tareas recomendadas para Mi día</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        
                        {/* Overdue */}
                        {suggestions.overdue.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">Vencidas</h3>
                                <div className="space-y-1">
                                    {suggestions.overdue.map(t => (
                                        <div key={t.id} className="bg-[#2D2D2D] p-3 rounded flex items-center justify-between group hover:bg-[#363636] transition">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{t.title}</p>
                                                <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                                                    <Calendar className="w-3 h-3" /> {new Date(t.dueDate!).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => toggleMyDay(t.id)}
                                                className="text-[#5CA5F3] hover:bg-[#444] p-1 rounded"
                                                title="Añadir a Mi día"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Due Today */}
                        {suggestions.dueToday.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">Para hoy</h3>
                                <div className="space-y-1">
                                    {suggestions.dueToday.map(t => (
                                        <div key={t.id} className="bg-[#2D2D2D] p-3 rounded flex items-center justify-between group hover:bg-[#363636] transition">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{t.title}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleMyDay(t.id)}
                                                className="text-[#5CA5F3] hover:bg-[#444] p-1 rounded"
                                                title="Añadir a Mi día"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Others */}
                        {suggestions.others.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-2">Otras tareas pendientes</h3>
                                <div className="space-y-1">
                                    {suggestions.others.map(t => (
                                        <div key={t.id} className="bg-[#2D2D2D] p-3 rounded flex items-center justify-between group hover:bg-[#363636] transition">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{t.title}</p>
                                                {t.listId !== 'tasks' && <p className="text-xs text-gray-500 mt-0.5">{lists.find(l => l.id === t.listId)?.title}</p>}
                                            </div>
                                            <button 
                                                onClick={() => toggleMyDay(t.id)}
                                                className="text-[#5CA5F3] hover:bg-[#444] p-1 rounded"
                                                title="Añadir a Mi día"
                                            >
                                                <PlusCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {suggestions.overdue.length === 0 && suggestions.dueToday.length === 0 && suggestions.others.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                                <p>No hay sugerencias por ahora</p>
                            </div>
                        )}
                    </div>
                </>
            ) : selectedTask && (
                // --- DETAIL PANEL (Existing) ---
                <>
                  <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="bg-[#2D2D2D] rounded p-4 mb-4 flex items-start gap-3 border border-transparent focus-within:border-gray-500 transition shadow-sm">
                      <div onClick={() => toggleTaskCompletion(selectedTask.id)} className={`flex-shrink-0 w-5 h-5 rounded-full border-2 cursor-pointer mt-1 grid place-content-center transition-all ${selectedTask.isCompleted ? 'bg-[#5CA5F3] border-[#5CA5F3]' : 'border-[#A0A0A0] hover:border-white'}`}>
                          {selectedTask.isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={selectedTask.title}
                          onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                          className={`w-full bg-transparent text-white font-semibold focus:outline-none text-base pb-1 border-b border-transparent focus:border-[#5CA5F3] ${selectedTask.isCompleted ? 'line-through text-gray-400' : ''}`}
                        />
                      </div>
                      <button onClick={() => toggleTaskImportance(selectedTask.id)}>
                        <Star className={`w-5 h-5 ${selectedTask.isImportant ? 'fill-current text-[#5CA5F3]' : 'text-[#A0A0A0]'}`} />
                      </button>
                    </div>

                    <div className="space-y-2 text-[#EAEAEA] text-sm">
                      <button 
                        onClick={() => toggleMyDay(selectedTask.id)}
                        className="w-full flex items-center gap-4 px-4 py-3 bg-[#2D2D2D] hover:bg-[#363636] rounded transition text-left group"
                      >
                        <Sun className={`w-5 h-5 group-hover:text-white ${selectedTask.addedToMyDay ? 'text-[#5CA5F3]' : 'text-[#A0A0A0]'}`} />
                        <span className={selectedTask.addedToMyDay ? 'text-blue-400' : ''}>
                          {selectedTask.addedToMyDay ? 'Quitar de Mi día' : 'Agregar a Mi día'}
                        </span>
                      </button>

                      <button className="w-full flex items-center gap-4 px-4 py-3 bg-[#2D2D2D] hover:bg-[#363636] rounded transition text-left group">
                        <Bell className="w-5 h-5 text-[#A0A0A0] group-hover:text-white" />
                        <span>Recordarme</span>
                      </button>
                      
                      <button className="w-full flex items-center gap-4 px-4 py-3 bg-[#2D2D2D] hover:bg-[#363636] rounded transition text-left group">
                        <Calendar className="w-5 h-5 text-[#A0A0A0] group-hover:text-white" />
                        <span>Fecha de vencimiento</span>
                      </button>
                    </div>

                    <textarea 
                      value={selectedTask.description || ''}
                      onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                      placeholder="Agregar nota" 
                      className="w-full h-32 bg-[#2D2D2D] mt-4 p-4 rounded resize-none text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-[#363636] transition"
                    />
                  </div>

                  <div className="p-4 border-t border-[#111] flex justify-between items-center text-xs text-[#A0A0A0] bg-[#202020]">
                    <span>Creado el {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => deleteTask(selectedTask.id)} className="p-2 hover:text-red-400 transition rounded hover:bg-white/5" title="Eliminar">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-white/10 rounded transition">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
            )}
        </aside>
      )}
    </div>
  );
}

// --- Sub-Components ---

function TaskItem({ task, isSelected, onSelect, onToggleComplete, onToggleImportant, listName }: { 
  task: Task; 
  isSelected: boolean; 
  onSelect: () => void; 
  onToggleComplete: () => void;
  onToggleImportant: (e: React.MouseEvent) => void;
  listName?: string;
}) {
  return (
    <div 
      onClick={onSelect}
      className={`group flex items-center gap-3 p-3 rounded bg-[#252525] bg-opacity-90 hover:bg-opacity-100 mb-1 cursor-pointer transition border border-transparent hover:border-gray-600 ${isSelected ? 'bg-opacity-100 border-gray-500 ring-1 ring-gray-500' : ''}`}
    >
      <div onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className={`flex-shrink-0 w-5 h-5 rounded-full border-2 cursor-pointer grid place-content-center transition-all ${task.isCompleted ? 'bg-[#5CA5F3] border-[#5CA5F3]' : 'border-[#A0A0A0] hover:border-white'}`}>
          {task.isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
      </div>
       
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-[15px] leading-tight ${task.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>{task.title}</span>
        <div className="flex items-center gap-2 mt-0.5">
            {listName && listName !== 'Tasks' && <span className="text-xs text-gray-400 font-light">{listName}</span>}
            {task.addedToMyDay && (
                <span className="text-xs text-gray-400 font-light flex items-center gap-1">
                   <span className="w-0.5 h-0.5 bg-gray-400 rounded-full"></span> 
                   <Sun className="w-3 h-3" /> Mi día
                </span>
            )}
            {task.dueDate && (
               <span className="text-xs text-gray-400 font-light flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString(undefined, {weekday:'short', day:'numeric'})}
               </span>
            )}
            {task.repeat && (
               <span className="text-xs text-gray-400 font-light flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
               </span>
            )}
        </div>
      </div>

      <button onClick={onToggleImportant} className={`text-gray-500 hover:text-[#5CA5F3] transition p-1 opacity-0 group-hover:opacity-100 ${task.isImportant ? 'opacity-100' : ''}`}>
        <Star className={`w-5 h-5 ${task.isImportant ? 'fill-current text-[#5CA5F3]' : ''}`} />
      </button>
    </div>
  );
}

// Simple Components for Settings View
const ToggleSwitch = ({ defaultChecked, checked, onChange }: { defaultChecked?: boolean, checked?: boolean, onChange?: () => void }) => {
  // Allow controlled or uncontrolled
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
  const finalChecked = isControlled ? checked : internalChecked;

  return (
    <button 
      onClick={() => {
        if (!isControlled) setInternalChecked(!internalChecked);
        if (onChange) onChange();
      }}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${finalChecked ? 'bg-[#5CA5F3]' : 'bg-gray-600'}`}
    >
      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${finalChecked ? 'translate-x-5' : ''}`} />
    </button>
  );
};

const ToggleRow = ({ label, defaultChecked }: { label: string, defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm">{label}</span>
    <ToggleSwitch defaultChecked={defaultChecked} />
  </div>
);

const SmartListToggle = ({ label, icon: Icon, checked, onChange }: { label: string, icon: any, checked: boolean, onChange: () => void }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-[#5CA5F3]" />
      <span>{label}</span>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);
