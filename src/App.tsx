import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  ArrowUpRight,
  ShoppingCart,
  CheckCircle2,
  Mic2,
  Globe2,
  Zap,
  Layout,
  UserPlus,
  PlayCircle,
  Clock,
  FileText,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Scale,
  FileCheck,
  Trash2,
  Info,
  User,
  Key,
  X,
  Youtube,
  Languages,
  SpellCheck,
  Mic,
  Copy,
  Volume2,
  Instagram,
  Facebook,
  Chrome,
  Image as ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Share2,
  ExternalLink,
  Upload,
  Settings,
  Keyboard,
  History,
  Monitor,
  Check,
  AlertCircle,
  Search,
  MoreHorizontal,
  LayoutDashboard,
  Package,
  Users,
  Cloud,
  HelpCircle,
  Store,
  Wallet,
  Megaphone,
  Bell,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BookOpen,
  Sun,
  Moon
} from "lucide-react";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  getDocFromServer
} from "firebase/firestore";

type ContentType = 
  | 'features' | 'pricing' | 'security' | 'versions' 
  | 'about' | 'careers' | 'blog' | 'contact' 
  | 'faq' | 'privacy' | 'terms' | 'youtube' | 'spellcheck' | 'translate' | 'avatar-gen' | 'profile' | null;

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  langName: string;
  langFlag: string;
  timestamp: Date;
}

const LANGUAGES = [
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'kr', name: '한국어', flag: '🇰🇷' },
  { code: 'jp', name: '日本語', flag: '🇯🇵' },
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [activeContent, setActiveContent] = useState<ContentType>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'shortcuts' | 'audio' | 'history' | 'integrations'>('general');
  const [showDMGView, setShowDMGView] = useState(false);
  const [installerPlatform, setInstallerPlatform] = useState<'mac' | 'windows'>('mac');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [selectedShortcut, setSelectedShortcut] = useState('Command + Shift');
  const [recordingMode, setRecordingMode] = useState('Hold to Talk');
  const [flowBarPosition, setFlowBarPosition] = useState<'bottom' | 'top'>('bottom');
  const [showFlowBar, setShowFlowBar] = useState(true);
  const [voiceNotifications, setVoiceNotifications] = useState(false);
  const [addPunctuation, setAddPunctuation] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['product']);
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [userName, setUserName] = useState("");
  const [userNickname, setUserNickname] = useState("");
  const [userAvatar, setUserAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [greeting, setGreeting] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(30);
  const [recordedText, setRecordedText] = useState("");
  const [transcriptionBuffer, setTranscriptionBuffer] = useState("");
  const transcriptionBufferRef = useRef("");
  const isRecordingRef = useRef(false);
  const recordingTimeRef = useRef(30);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [spellCheckText, setSpellCheckText] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  const [loginName, setLoginName] = useState("");
  const [googleTokens, setGoogleTokens] = useState<any>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleTokens(event.data.tokens);
        toast.success("Google Drive амжилттай холбогдлоо!");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleConnect = async () => {
    setIsConnectingDrive(true);
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      if (data.url) {
        window.open(data.url, 'google_oauth', 'width=600,height=700');
      } else {
        throw new Error(data.error || "Failed to get auth URL");
      }
    } catch (error) {
      console.error("Google connect error:", error);
      toast.error("Google Drive-д холбогдоход алдаа гарлаа.");
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleSaveToDrive = async (fileName: string, content: string, mimeType: string = 'text/plain') => {
    if (!googleTokens) {
      toast.info("Эхлээд Google Drive-аа холбоно уу.");
      setSettingsTab('integrations');
      setShowSettingsModal(true);
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: googleTokens,
          fileName,
          content,
          mimeType
        })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        toast.success(`"${data.file.name}" Google Drive-д хадгалагдлаа!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Drive upload error:", error);
      toast.error("Google Drive-д хадгалахад алдаа гарлаа.");
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsRegistered(!!currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setUserName("");
        setUserNickname("");
        setUserAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
        setTranslationHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // User Profile Sync
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserNickname(data.nickname || "");
        setUserName(data.nickname || "");
        setUserAvatar(data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`);
      } else {
        // Create initial profile if it doesn't exist
        const initialData = {
          nickname: user.displayName || user.email?.split('@')[0] || "Хэрэглэгч",
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          email: user.email,
          createdAt: Timestamp.now()
        };
        setDoc(userDocRef, initialData).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Translation History Sync
  useEffect(() => {
    if (!user) return;

    const historyRef = collection(db, "users", user.uid, "translations");
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate()
      })) as TranslationHistoryItem[];
      setTranslationHistory(history);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/translations`));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLoginModal(false);
      toast.success("Амжилттай нэвтэрлээ!");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Нэвтрэхэд алдаа гарлаа.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsRegistered(false);
      setActiveContent(null);
      toast.info("Системээс гарлаа.");
    } catch (error) {
      toast.error("Гарахад алдаа гарлаа.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      toast.success("Бүртгэл амжилттай!");
    } catch (error: any) {
      toast.error(error.message || "Бүртгэхэд алдаа гарлаа.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      toast.success("Амжилттай нэвтэрлээ!");
    } catch (error: any) {
      toast.error("Имэйл эсвэл нууц үг буруу байна.");
    }
  };

  // YouTube Subtitle State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubtitleReady, setIsSubtitleReady] = useState(false);

  // Avatar Gen State
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("3D Render");
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarBaseImage, setAvatarBaseImage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AVATARS = [
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Felix",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Luna",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Milo",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Aria",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Leo",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Maya",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Oliver",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Sophie",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Jasper",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=Elena"
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    let msg = "";
    if (hour < 12) msg = "Өглөөний мэнд";
    else if (hour < 18) msg = "Өдрийн мэнд";
    else msg = "Оройн мэнд";
    setGreeting(msg);
  }, []);

  // Scroll to top when content changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeContent, showAllFeatures]);

  const lastInterimRef = useRef("");

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(30);
    recordingTimeRef.current = 30;
    lastInterimRef.current = "";
    
    toast.success("Бичлэг дууслаа. Текст бэлэн боллоо!", { duration: 3000 });
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (isRecording) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Таны хөтөч дуу хоолой таних технологийг дэмжихгүй байна.");
      return;
    }

    // Initialize state BEFORE starting recognition
    setRecordedText("");
    setTranscriptionBuffer("");
    transcriptionBufferRef.current = "";
    lastInterimRef.current = "";
    setRecordingTime(30);
    recordingTimeRef.current = 30;
    setIsRecording(true);
    isRecordingRef.current = true;

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang.code === 'mn' ? 'mn-MN' : 'en-US';

      recognition.onstart = () => {
        console.log("Speech recognition active");
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (currentFinal) {
          transcriptionBufferRef.current += (transcriptionBufferRef.current ? " " : "") + currentFinal.trim();
          lastInterimRef.current = ""; // Clear interim as it's now final
          const updated = transcriptionBufferRef.current;
          setTranscriptionBuffer(updated);
          setRecordedText(updated);
        } else if (interimTranscript) {
          lastInterimRef.current = interimTranscript.trim();
          const base = transcriptionBufferRef.current + (transcriptionBufferRef.current ? " " : "");
          setRecordedText(base + lastInterimRef.current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
          // These are common when silent, we'll let onend handle the restart
          return;
        }
        if (event.error === 'not-allowed') {
          toast.error("Микрофон ашиглах зөвшөөрөл олгоогүй байна.");
          stopRecording();
        }
      };

      recognition.onend = () => {
        // If we have pending interim text, commit it before restarting
        if (lastInterimRef.current) {
          transcriptionBufferRef.current += (transcriptionBufferRef.current ? " " : "") + lastInterimRef.current;
          setTranscriptionBuffer(transcriptionBufferRef.current);
          setRecordedText(transcriptionBufferRef.current);
          lastInterimRef.current = "";
        }

        if (isRecordingRef.current && recordingTimeRef.current > 0) {
          console.log("Auto-restarting recognition for continuity...");
          setTimeout(() => {
            if (isRecordingRef.current && recordingTimeRef.current > 0) {
              try {
                recognitionRef.current = createRecognition();
                recognitionRef.current.start();
              } catch (e) {
                console.error("Restart failed", e);
              }
            }
          }, 50);
        } else {
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      };

      return recognition;
    };

    try {
      const recognition = createRecognition();
      recognition.start();
      recognitionRef.current = recognition;
      toast.info("30 секундын бичлэг эхэллээ. Та ярьж эхэлнэ үү.", { duration: 2000 });
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Бичлэг эхлүүлэхэд алдаа гарлаа.");
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [isRecording, selectedLang.code, stopRecording]);

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (isRecording && recordingTime > 0) {
      timer = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev - 1;
          recordingTimeRef.current = next;
          if (next <= 0) {
            clearInterval(timer);
            stopRecording();
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, stopRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Start: Command/Control + Shift
      if (modifier && e.shiftKey && !isRecording) {
        e.preventDefault();
        startRecording();
      }

      // Stop: Command + Space (Mac) or Control + Space (Windows)
      if (modifier && e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, startRecording, stopRecording]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recordedText);
    toast.success("Бичвэрийг хууллаа!");
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error("Орчуулах текст оруулна уу.");
      return;
    }

    const translationPromise = new Promise(async (resolve, reject) => {
      try {
        const mockTranslation = `[${selectedLang.name}] ${sourceText}`;
        setTranslatedText(mockTranslation);
        
        if (user) {
          const historyRef = collection(db, "users", user.uid, "translations");
          await addDoc(historyRef, {
            sourceText,
            translatedText: mockTranslation,
            langName: selectedLang.name,
            langFlag: selectedLang.flag,
            timestamp: Timestamp.now()
          });
        } else {
          // Local fallback for non-logged in users
          const newItem: TranslationHistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            sourceText,
            translatedText: mockTranslation,
            langName: selectedLang.name,
            langFlag: selectedLang.flag,
            timestamp: new Date(),
          };
          setTranslationHistory(prev => [newItem, ...prev]);
        }
        resolve(mockTranslation);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(translationPromise, {
      loading: 'Орчуулж байна...',
      success: 'Орчуулга амжилттай!',
      error: 'Алдаа гарлаа.',
    });
  };

  const handleYoutubeDownload = () => {
    if (!youtubeUrl.trim()) {
      toast.error("Линкийг оруулна уу.");
      return;
    }
    if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
      toast.error("Зөвхөн YouTube линк оруулна уу.");
      return;
    }

    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Subtitle татаж байна...',
      success: () => {
        setIsSubtitleReady(true);
        return 'Амжилттай татлаа!';
      },
      error: 'Алдаа гарлаа.',
    });
  };

  const handleShare = (type: 'social' | 'email') => {
    const shareUrl = `https://ayalga.ai/download/subtitle?v=${encodeURIComponent(youtubeUrl)}`;
    const text = `Аялга AI ашиглан YouTube бичлэгийн subtitle татлаа: ${shareUrl}`;
    
    if (type === 'social') {
      if (navigator.share) {
        navigator.share({
          title: 'YouTube Subtitle',
          text: text,
          url: shareUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text);
        toast.success("Холбоосыг хууллаа! Та олон нийтийн сүлжээндээ хуваалцана уу.");
      }
    } else {
      window.location.href = `mailto:?subject=YouTube Subtitle&body=${encodeURIComponent(text)}`;
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      toast.error("Аватар тайлбар оруулна уу.");
      return;
    }

    setIsGeneratingAvatar(true);
    setGeneratedAvatar(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      // Step 1: Expand the prompt into a hyper-detailed English version
      // This handles Mongolian input and ensures high quality
      const expansionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate and expand the following avatar description into a hyper-detailed, professional image generation prompt for a ${avatarStyle} style. 
        User input (could be in Mongolian): "${avatarPrompt}"
        
        Requirements:
        1. If the user mentions text (like "sansariin nisgegch" or "сансрын нисгэгч"), ensure the prompt explicitly asks for that exact text to be clearly and correctly rendered on the image (e.g., on a suit or background) in Mongolian script if requested.
        2. Expand the prompt with high-quality descriptors: lighting, texture, composition, and specific ${avatarStyle} characteristics.
        3. Include a "Negative Prompt" section to avoid common artifacts (blur, distortion, extra limbs, low quality).
        4. If a reference image is provided, focus on maintaining the character's essence while applying the style.
        5. For "Realistic Skin Tone", ensure the skin texture is natural and lifelike.
        
        Output format:
        PROMPT: [The detailed English prompt]
        NEGATIVE: [The negative prompt]`,
      });

      const expandedText = expansionResponse.text || "";
      const promptMatch = expandedText.match(/PROMPT:\s*(.*)/i);
      const negativeMatch = expandedText.match(/NEGATIVE:\s*(.*)/i);
      
      const finalPrompt = promptMatch ? promptMatch[1] : `Hyper-detailed ${avatarStyle} avatar of ${avatarPrompt}, 8k, masterpiece`;
      const negativePrompt = negativeMatch ? negativeMatch[1] : "low quality, blurry, distorted, extra limbs";

      const contents: any = {
        parts: [{ text: `${finalPrompt}. Negative Prompt: ${negativePrompt}` }]
      };

      if (avatarBaseImage) {
        contents.parts.push({
          inlineData: {
            data: avatarBaseImage.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageBase64 = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }

      if (imageBase64) {
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        setGeneratedAvatar(imageUrl);
        
        if (user) {
          const avatarsRef = collection(db, "users", user.uid, "avatars");
          await addDoc(avatarsRef, {
            url: imageUrl,
            prompt: avatarPrompt,
            style: avatarStyle,
            timestamp: Timestamp.now()
          });
        }
        
        toast.success("Аватар амжилттай үүсгэлээ!");
      } else {
        throw new Error("Failed to generate image.");
      }
    } catch (error) {
      console.error("Avatar generation error:", error);
      toast.error("Аватар үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBaseImage(reader.result as string);
        toast.success("Image loaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfilePage = () => {
    return (
      <motion.div 
        key="profile-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen pt-32 pb-20 px-6 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setActiveContent(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#0052FF] font-black uppercase tracking-widest text-xs mb-12 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Буцах</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Profile Info & Avatar Selection */}
            <div className="lg:col-span-4 space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-center"
              >
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl cursor-pointer group relative"
                  >
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-white animate-spin-slow" />
                    </div>
                  </motion.div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-[#0052FF] text-white rounded-full shadow-lg transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                </div>
                <h3 className="text-2xl font-black mb-1">{userNickname}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">{userName}</p>
                
                <div className="flex justify-center gap-4">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Орчуулга</p>
                    <p className="text-xl font-black text-[#0052FF]">{translationHistory.length}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Төлөв</p>
                    <p className="text-xl font-black text-green-500">Active</p>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 p-8 rounded-[40px] border border-slate-100"
              >
                <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0052FF]" />
                  <span>Мэдээлэл засах</span>
                </h4>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Имэйл хаяг</label>
                    <input 
                      type="text" 
                      defaultValue={userName}
                      readOnly
                      className="w-full px-5 py-3 bg-slate-100 border-2 border-transparent rounded-xl outline-none font-bold text-slate-500 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Хоч нэр</label>
                    <input 
                      name="profile-nick"
                      type="text" 
                      defaultValue={userNickname}
                      className="w-full px-5 py-3 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-[#0052FF] font-bold transition-all text-sm"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02, brightness: 1.1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3 bg-[#0052FF] text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all text-sm"
                  >
                    Хадгалах
                  </motion.button>
                </form>
              </motion.div>

              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0052FF]" />
                  <span>Аватар сонгох</span>
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-[#0052FF] hover:bg-blue-50 transition-all group"
                  >
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#0052FF]" />
                    <span className="text-[8px] font-black text-slate-400 group-hover:text-[#0052FF] uppercase">Хуулах</span>
                  </motion.button>
                  {AVATARS.map((url, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setUserAvatar(url);
                        toast.success("Аватар амжилттай солигдлоо!", { duration: 3000 });
                      }}
                      className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${userAvatar === url ? 'border-[#0052FF] bg-blue-50' : 'border-white hover:border-blue-200'}`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: History & Avatar Gen */}
            <div className="lg:col-span-8 space-y-8">
              {/* AI Avatar Generator Section */}
              <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <h4 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-[#0052FF]" />
                    <span>AI Аватар Үүсгэгч</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Аватар тайлбар (Prompt)</label>
                      <textarea 
                        value={avatarPrompt}
                        onChange={(e) => setAvatarPrompt(e.target.value)}
                        placeholder="Жишээ: Сансрын нисгэгч хувцастай, инээмсэглэж буй залуу..."
                        className="w-full h-32 p-6 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-[#0052FF] font-bold text-sm resize-none transition-all"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Загвар сонгох</label>
                      <div className="grid grid-cols-2 gap-3">
                        {["Pixel", "3D Render", "Pixar Style", "Cyberpunk", "Anime", "Realistic", "Oil Painting", "Realistic Skin Tone"].map(style => (
                          <button 
                            key={style}
                            onClick={() => setAvatarStyle(style)}
                            className={`py-3 px-4 rounded-xl font-bold text-[10px] transition-all border-2 ${avatarStyle === style ? 'bg-[#0052FF] text-white border-[#0052FF]' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Зураг ачаалах (Optional)</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => document.getElementById('profile-avatar-base-upload')?.click()}
                          className="flex-1 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl font-bold text-sm text-slate-400 hover:border-[#0052FF] hover:text-[#0052FF] transition-all flex items-center justify-center gap-2"
                        >
                          <ImageIcon className="w-5 h-5" />
                          <span>Зураг сонгох</span>
                        </button>
                        {avatarBaseImage && (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#0052FF]">
                            <img src={avatarBaseImage} alt="Base" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              onClick={() => setAvatarBaseImage(null)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <input 
                        id="profile-avatar-base-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleBaseImageUpload}
                      />
                    </div>

                    <button 
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar}
                      className="w-full py-6 bg-[#0052FF] text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-200 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAvatar ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Үүсгэж байна...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6 fill-current" />
                          <span>Аватар үүсгэх</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 p-8 min-h-[400px]">
                    {generatedAvatar ? (
                      <div className="space-y-6 text-center">
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-64 h-64 rounded-[40px] overflow-hidden border-4 border-blue-50 shadow-2xl mx-auto"
                        >
                          <img src={generatedAvatar} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </motion.div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setUserAvatar(generatedAvatar);
                              toast.success("Профайл зураг амжилттай солигдлоо!");
                            }}
                            className="flex-1 py-4 bg-[#0052FF] text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:brightness-110 transition-all"
                          >
                            Профайл болгох
                          </button>
                          <a 
                            href={generatedAvatar} 
                            download="avatar.png"
                            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                          >
                            <Download className="w-6 h-6" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm">Таны аватар энд гарна</p>
                        <p className="text-slate-300 text-xs">Зүүн талын хэсэгт тохиргоогоо хийж, "Аватар үүсгэх" товчлуур дээр дарна уу.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 min-h-[600px]">
                <div className="flex items-center justify-between mb-10">
                  <h4 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <Clock className="w-8 h-8 text-[#0052FF]" />
                    <span>Орчуулгын түүх</span>
                  </h4>
                  {translationHistory.length > 0 && (
                    <button 
                      onClick={() => setTranslationHistory([])}
                      className="text-red-500 hover:text-red-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Цэвэрлэх</span>
                    </button>
                  )}
                </div>

                {translationHistory.length > 0 ? (
                  <div className="space-y-4">
                    {translationHistory.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-[#0052FF] transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.langFlag}</span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.langName}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Эх бичвэр</p>
                            <p className="text-sm font-medium text-slate-600 line-clamp-3">{item.sourceText}</p>
                          </div>
                          <div className="bg-blue-50/50 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Орчуулга</p>
                            <p className="text-sm font-bold text-blue-900 line-clamp-3">{item.translatedText}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-50 mb-6">
                      <Clock className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold">Одоогоор түүх байхгүй байна.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLegalContent = () => {
    const contentMap: Record<string, { title: string, icon: any, text: React.ReactNode }> = {
      privacy: {
        title: "Нууцлалын бодлого",
        icon: Lock,
        text: (
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 border-l-4 border-[#0052FF] pl-4">Сүүлд шинэчилсэн: 2026 оны 4-р сарын 7</p>
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h4 className="text-xl font-black text-slate-900 mb-4">1. Мэдээлэл цуглуулах зарчим</h4>
              <p>Аялга AI систем нь хэрэглэгчийн оруулсан аудио өгөгдөл болон хувийн мэдээллийг зөвхөн үйлчилгээний чанарыг сайжруулах, Транскрипци хийх зорилгоор ашиглана. Бид таны өгөгдлийг AI-ийг сургахад ашигладаггүй гэдгийг тодорхой хэлэх байна.</p>
            </section>
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h4 className="text-xl font-black text-slate-900 mb-4">2. Өгөгдлийн аюулгүй байдал</h4>
              <p>Бүх өгөгдөл AES-256 стандартаар нууцлагдах бөгөөд сервер дээрх мэдээлэл нь олон улсын ISO/IEC 27001 аюулгүй байдлын стандартыг бүрэн хангасан болно. Аудио файлыг хөрвүүлсний дараа 24-48 цагийн дотор бүрэн устгадаг.</p>
            </section>
          </div>
        )
      },
      faq: {
        title: "Түгээмэл асуултууд (FAQ)",
        icon: HelpCircle,
        text: (
          <div className="space-y-8">
            <p className="text-slate-500 font-medium">Та эндээс дэлгэрэнгүй мэдээлэл уншаарай. Баярлалаа.</p>
            <div className="grid grid-cols-1 gap-6">
              {[
                {
                  q: "Аялга гэж юу вэ?",
                  a: "Аялга бол монгол хэлний яриаг бичвэр болгох (ASR) десктоп-desktop программ юм. Товчлуур дарж, Монголоор ярихад текст автоматаар таны идэвхтэй программ руу бичигдэнэ. macOS болон Windows дээр ажиллана."
                },
                {
                  q: "Ямар үнэтэй вэ?",
                  a: "Бид 'Үнэгүй' төлөвлөгөөнөөс гадна. Энгийн (15,000₮), Про (25,000₮), Премиум (60,000₮) гэсэн сонголтуудыг санал болгодог. Про төлөвлөгөө нь манай хамгийн эрэлттэй, Шилдэг сонголт юм. Та картаар болон QPay-ээр төлөх боломжтой бөгөөд жилийн төлөвлөгөө нь илүү хэмнэлттэй байх болно."
                },
                {
                  q: "Монгол, Англи ямарч улсын хэлийг хольж ярьж болох уу?",
                  a: "Тийм. Аялга нь өгүүлбэр доторх хэлний шилжилтийг (intra-sentential code-switching) техникийн түвшинд дэмждэг. Энэ нь техникийн нэр томьёог англиар, Тайлбарыг Монголоор чөлөөтэй хэлэх боломжийг олгох бөгөөд хэл хооронд шилжих үед алдаа гарах магадлалыг 88% хүртэл бууруулсан."
                },
                {
                  q: "Файл хөрвүүлэх (Diarization) гэж юу вэ?",
                  a: "Энэ нь аудио файлыг бичвэр болгохоос гадна Хэн, Хэзээ ярьсан бэ? Гэдгийг AI ашиглан ялгах процесс юм. Аялга нь спикер бүрийн дуу хоолойны давтамж, Өнгө аясыг (pitch, tone) шинжлэн Speaker 1, Speaker 2 гэж ялган бүтэцлэгдсэн тэмдэглэл болгодог."
                }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#0052FF] text-white rounded-lg flex items-center justify-center text-sm">Q</span>
                    {item.q}
                  </h4>
                  <p className="text-slate-600 leading-relaxed pl-11">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
      terms: {
        title: "Үйлчилгээний нөхцөл",
        icon: Scale,
        text: (
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-900 border-l-4 border-[#0052FF] pl-4">Хууль эрх зүйн баримт бичиг v2.4</p>
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h4 className="text-xl font-black text-slate-900 mb-4">1. Үйлчилгээний хамрах хүрээ</h4>
              <p>Энэхүү нөхцөл нь Аялга AI платформыг ашиглах бүх харилцааг зохицуулна. Хэрэглэгч бүртгэл үүсгэснээр эдгээр нөхцөлийг хүлээн зөвшөөрсөнд тооцно.</p>
            </section>
          </div>
        )
      },
      contact: {
        title: "Холбоо барих",
        icon: Phone,
        text: (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Phone className="text-[#0052FF] w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Утас</p>
                  <p className="text-2xl font-black text-slate-900">Холбогдох утас - 72126984</p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-6 shadow-sm">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Mail className="text-[#0052FF] w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Имэйл</p>
                  <p className="text-2xl font-black text-slate-900">munkh11photography8@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      youtube: {
        title: "YouTube Subtitle Татах",
        icon: Youtube,
        text: (
          <div className="space-y-8">
            <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100">
              <h4 className="text-2xl font-black mb-6">Линкийг энд оруулна уу?</h4>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setIsSubtitleReady(false);
                  }}
                  placeholder="https://youtube.com/watch?v=..." 
                  className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-[#0052FF] font-bold" 
                />
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleYoutubeDownload}
                      className="bg-[#0052FF] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Татах</span>
                    </motion.button>
              </div>

              {isSubtitleReady && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 p-8 bg-white rounded-[32px] border border-blue-100 shadow-xl shadow-blue-50"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900">Subtitle бэлэн боллоо</p>
                        <p className="text-sm font-medium text-slate-400">Татаж авах эсвэл хуваалцах боломжтой.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => toast.success("Татаж авч байна...")}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>SRT татах</span>
                      </button>
                      
                      <button 
                        onClick={() => handleSaveToDrive('YouTube_Subtitle.srt', 'YouTube-ээс татсан хадмал бичвэр...')}
                        disabled={isUploadingToDrive}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-[#0052FF] rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                      >
                        {isUploadingToDrive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                        <span>Drive-д хадгалах</span>
                      </button>
                      
                      <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
                      
                      <button 
                        onClick={() => handleShare('social')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-[#0052FF] rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Хуваалцах</span>
                      </button>
                      
                      <button 
                        onClick={() => handleShare('email')}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Имэйлээр</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Хурдан", desc: "Хэдхэн секундын дотор", icon: Zap },
                { title: "Найдвартай", desc: "99% нарийвчлалтай", icon: ShieldCheck },
                { title: "Үнэгүй", desc: "Хязгааргүй ашиглах", icon: Sparkles }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-[#0052FF]" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{item.title}</p>
                    <p className="text-xs font-medium text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      spellcheck: {
        title: "Үгийн алдаа шалгуур",
        icon: SpellCheck,
        text: (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Toolbar */}
            <div className="flex lg:flex-col gap-4 w-full lg:w-auto">
              <button 
                onClick={() => {
                  setSpellCheckText("");
                  toast.info("Шинэ хуудас бэлэн боллоо.");
                }}
                className="flex-1 lg:flex-none p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#0052FF] group"
                title="Шинэ файл"
              >
                <FileCheck className="w-6 h-6 mx-auto" />
              </button>
              <button 
                onClick={() => handleSaveToDrive('SpellCheck_Result.txt', spellCheckText)}
                disabled={isUploadingToDrive}
                className="flex-1 lg:flex-none p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#0052FF]"
                title="Google Drive-д хадгалах"
              >
                {isUploadingToDrive ? <Loader2 className="w-6 h-6 mx-auto animate-spin" /> : <Cloud className="w-6 h-6 mx-auto" />}
              </button>
              <button 
                onClick={() => {
                  if (!spellCheckText) return toast.error("Хуулах текст алга!");
                  navigator.clipboard.writeText(spellCheckText);
                  toast.success("Бичвэр хуулагдлаа!");
                }}
                className="flex-1 lg:flex-none p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-[#0052FF]"
                title="Хуулж авах"
              >
                <Copy className="w-6 h-6 mx-auto" />
              </button>
              <button 
                onClick={() => {
                  setSpellCheckText("");
                  toast.error("Бичвэр устаглаа!");
                }}
                className="flex-1 lg:flex-none p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 hover:text-red-500"
                title="Устгах"
              >
                <Trash2 className="w-6 h-6 mx-auto" />
              </button>
            </div>

            {/* Main Editor */}
            <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden w-full">
              <div className="p-8 lg:p-10">
                <textarea 
                  value={spellCheckText}
                  onChange={(e) => setSpellCheckText(e.target.value)}
                  placeholder="Шалгах бичвэрээ энд оруулна уу..."
                  className="w-full min-h-[400px] text-xl font-medium text-slate-700 leading-relaxed outline-none resize-none placeholder:text-slate-300"
                />
                
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Үгийн тоо</p>
                      <p className="text-4xl font-black text-slate-900">
                        {spellCheckText.trim() ? spellCheckText.trim().split(/\s+/).length : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Тэмдэгтийн тоо</p>
                      <p className="text-4xl font-black text-slate-900">
                        {spellCheckText.length}<span className="text-xl text-slate-300">/2000</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (!spellCheckText) return toast.info("Шалгах текст оруулна уу.");
                      toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                        loading: 'Алдааг шалгаж байна...',
                        success: 'Шалгаж дууслаа!',
                        error: 'Алдаа гарлаа.',
                      });
                    }}
                    className="w-full md:w-auto bg-[#00C853] text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl shadow-green-100 hover:brightness-110 transition-all flex items-center justify-center gap-3"
                  >
                    <span>Алдааг шалгах</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error List Sidebar */}
            <div className="w-full lg:w-80 bg-white rounded-[40px] border border-slate-200 shadow-xl p-8">
              <h5 className="text-lg font-black mb-8">Алдаатай үгсийн жагсаалт</h5>
              {spellCheckText ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 font-medium italic">Одоогоор алдаа илрээгүй байна.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <SpellCheck className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Жагсаалт хоосон</p>
                </div>
              )}
            </div>
          </div>
        )
      },
      translate: {
        title: "Орчуулга",
        icon: Languages,
        text: (
          <div className="space-y-8">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => setSelectedLang(lang)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap ${selectedLang.code === lang.code ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <textarea 
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Эх бичвэр..." 
                  className="w-full h-64 p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] outline-none focus:border-[#0052FF] font-medium text-lg resize-none transition-all"
                ></textarea>
                <motion.button 
                  whileHover={{ scale: 1.02, brightness: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTranslate}
                  className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
                >
                  <Zap className="w-6 h-6 fill-current" />
                  <span>Орчуулах</span>
                </motion.button>
              </div>
              <div className="relative group">
                <div className="h-full min-h-[16rem] p-8 bg-blue-50 border-2 border-blue-100 rounded-[32px] font-medium text-lg text-blue-900">
                  {translatedText || `${selectedLang.name} хэл рүү орчуулсан бичвэр энд гарна...`}
                </div>
                {translatedText && (
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={() => handleSaveToDrive(`Translation_${selectedLang.name}.txt`, translatedText)}
                      disabled={isUploadingToDrive}
                      className="p-3 bg-white rounded-xl shadow-md text-[#0052FF] hover:scale-110 transition-all"
                      title="Google Drive-д хадгалах"
                    >
                      {isUploadingToDrive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(translatedText);
                        toast.success("Хуулж авлаа!");
                      }}
                      className="p-3 bg-white rounded-xl shadow-md text-[#0052FF] hover:scale-110 transition-all"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Translation History */}
            <div className="mt-12 pt-12 border-t border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                  <Clock className="w-6 h-6 text-[#0052FF]" />
                  Орчуулгын түүх
                </h4>
                {translationHistory.length > 0 && (
                  <button 
                    onClick={() => {
                      setTranslationHistory([]);
                      toast.info("Түүх устлаа.");
                    }}
                    className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Бүгдийг устгах
                  </button>
                )}
              </div>

              {translationHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {translationHistory.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => {
                        setSourceText(item.sourceText);
                        setTranslatedText(item.translatedText);
                        toast.info("Сонгосон орчуулгыг ачааллаа.");
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                          <span className="text-sm">{item.langFlag}</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.langName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">
                          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-2">{item.sourceText}</p>
                      <p className="text-xs font-medium text-slate-400 line-clamp-2">{item.translatedText}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Clock className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Орчуулгын түүх хоосон байна</p>
                </div>
              )}
            </div>
          </div>
        )
      },
      'avatar-gen': {
        title: "AI Аватар Үүсгэгч",
        icon: ImageIcon,
        text: (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                  <h4 className="text-xl font-black text-slate-900">Аватар тохиргоо</h4>
                  
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Аватар тайлбар (Prompt)</label>
                    <textarea 
                      value={avatarPrompt}
                      onChange={(e) => setAvatarPrompt(e.target.value)}
                      placeholder="Жишээ: Сансрын нисгэгч хувцастай, инээмсэглэж буй залуу..."
                      className="w-full h-32 p-6 bg-white border-2 border-slate-100 rounded-3xl outline-none focus:border-[#0052FF] font-bold text-sm resize-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Загвар сонгох</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Pixel", "3D Render", "Cyberpunk", "Anime", "Realistic", "Oil Painting", "Realistic Skin Tone"].map(style => (
                        <button 
                          key={style}
                          onClick={() => setAvatarStyle(style)}
                          className={`py-3 px-4 rounded-xl font-bold text-[10px] transition-all border-2 ${avatarStyle === style ? 'bg-[#0052FF] text-white border-[#0052FF]' : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Зураг ачаалах (Optional)</label>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => document.getElementById('avatar-base-upload')?.click()}
                        className="flex-1 py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl font-bold text-sm text-slate-400 hover:border-[#0052FF] hover:text-[#0052FF] transition-all flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span>Зураг сонгох</span>
                      </button>
                      {avatarBaseImage && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#0052FF]">
                          <img src={avatarBaseImage} alt="Base" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => setAvatarBaseImage(null)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input 
                      id="avatar-base-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleBaseImageUpload}
                    />
                  </div>

                <motion.button 
                  whileHover={{ scale: 1.02, brightness: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateAvatar}
                  disabled={isGeneratingAvatar}
                  className="w-full py-6 bg-[#0052FF] text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAvatar ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Loader2 className="w-6 h-6" />
                      </motion.div>
                      <span>Үүсгэж байна...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 fill-current" />
                      <span>Аватар үүсгэх</span>
                    </>
                  )}
                </motion.button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[40px] border border-slate-100 p-12 min-h-[500px] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {generatedAvatar ? (
                    <motion.div 
                      key="generated"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8 text-center"
                    >
                      <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-[#0052FF] to-purple-500 rounded-[48px] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                        <img 
                          src={generatedAvatar} 
                          alt="Generated Avatar" 
                          className="relative w-80 h-80 rounded-[40px] shadow-2xl object-cover border-4 border-white"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-4">
                        <button 
                          onClick={() => {
                            setUserAvatar(generatedAvatar);
                            toast.success("Профайл зураг амжилттай солигдлоо!");
                          }}
                          className="px-8 py-4 bg-[#0052FF] text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center gap-2"
                        >
                          <User className="w-5 h-5" />
                          <span>Профайл болгох</span>
                        </button>
                        <a 
                          href={generatedAvatar} 
                          download="ai-avatar.png"
                          className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          <span>Татах</span>
                        </a>
                        <button 
                          onClick={handleGenerateAvatar}
                          className="px-8 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black shadow-sm hover:text-[#0052FF] hover:border-[#0052FF] transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Дахин үүсгэх</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-6"
                    >
                      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-slate-200">
                        {isGeneratingAvatar ? (
                          <Loader2 className="w-12 h-12 text-[#0052FF] animate-spin" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-slate-200" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-xl font-black text-slate-900">Таны аватар энд гарна</h5>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto">Зүүн талын хэсэгт тохиргоогоо хийж, "Аватар үүсгэх" товчлуур дээр дарна уу.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )
      },
      about: {
        title: "Бидний тухай",
        icon: Sparkles,
        text: (
          <div className="space-y-8 text-slate-600 leading-relaxed text-lg">
            <p>Аялга AI нь Монгол хэлний соёл, Өв уламжлалыг орчин үеийн хиймэл оюун ухааны технологитой холбох зорилготойгоор 2025 онд байгуулагдсан үндэсний технологийн компани юм.</p>
            <p>Бидний эрхэм зорилго бол хэлний бэрхшээлийг арилгаж, Дижитал ертөнцөд, Монгол хэлний үнэ цэнийг нэмэгдүүлэх, Хүмүүсийн ажлын бүтээмжийг шинэ түвшинд гаргах явдал юм.</p>
          </div>
        )
      },
      workflow: {
        title: "Хэрхэн ашиглах вэ?",
        icon: BookOpen,
        text: (
          <div className="space-y-12">
            <div className="bg-blue-50 p-10 rounded-[40px] border border-blue-100">
              <h4 className="text-2xl font-black text-blue-900 mb-6">Windows дээр ашиглах</h4>
              <p className="text-slate-600 font-bold mb-8">Taskbar-аас программаа нээж, Дурын программ дээр (Word, Slack, Browser) шууд бичиж эхлээрэй.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { step: "1", title: "Бичлэг эхлүүлэх", desc: "Хурал эхлэхэд микрофон дээр дарж эсвэл Cmd+Shift товчийг ашиглан бичлэгээ эхлүүлнэ." },
                  { step: "2", title: "AI Хөрвүүлэлт", desc: "Хурал дуусахад AI автоматаар яриаг бичвэр болгож, хэн юу ярьсныг (Diarization) ялгана." },
                  { step: "3", title: "Тэмдэглэл авах", desc: "Бэлэн болсон бичвэрийг хуулж аваад хурлын протокол болгон ашиглана." }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0052FF] font-black text-xl shadow-sm">
                      {item.step}
                    </div>
                    <h5 className="font-black text-slate-900">{item.title}</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                <h4 className="text-xl font-black mb-4">macOS дээр ашиглах</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">Menu bar-д байрлах Аялга AI дүрс дээр дарж тохиргоогоо хийнэ үү. Dark/Light горимыг автоматаар дэмжинэ.</p>
                <div className="flex items-center gap-3 text-[#0052FF] font-bold text-sm">
                  <Monitor className="w-5 h-5" />
                  <span>Native macOS App</span>
                </div>
              </div>
              <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                <h4 className="text-xl font-black mb-4">Бусад боломжууд</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">Аялга AI нь зөвхөн бичвэр болгоод зогсохгүй, үгийн алдаа шалгах, орчуулах, YouTube subtitle татах зэрэг олон боломжтой.</p>
                <div className="flex items-center gap-3 text-[#0052FF] font-bold text-sm">
                  <Monitor className="w-5 h-5" />
                  <span>All-in-one AI Tool</span>
                </div>
              </div>
            </div>
          </div>
        )
      },
      pricing: {
        title: "Төлөвлөгөө",
        icon: ShoppingCart,
        text: (
          <div className="space-y-12 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "Үнэгүй",
                  price: "₮0",
                  features: ["30 минут үнэгүй", "Стандарт нарийвчлал"],
                  missing: ["Файл хөрвүүлэх", "AI Аватар", "99% нарийвчлал"],
                  color: "bg-slate-50",
                  textColor: "text-slate-900"
                },
                {
                  name: "Энгийн",
                  price: "₮15,000",
                  features: ["5 цаг транскрипци", "95% нарийвчлал", "Имэйл дэмжлэг"],
                  missing: ["Файл хөрвүүлэх", "AI Аватар"],
                  color: "bg-slate-50",
                  textColor: "text-slate-900"
                },
                {
                  name: "Про",
                  price: "₮25,000",
                  features: ["Хязгааргүй транскрипци", "99.2% Нарийвчлал", "Файл хөрвүүлэх", "AI Аватар"],
                  missing: [],
                  color: "bg-[#0052FF]",
                  textColor: "text-white",
                  popular: true
                },
                {
                  name: "Премиум",
                  price: "₮60,000",
                  features: ["Бүх Про боломжууд", "API хандалт", "24/7 VIP дэмжлэг", "Custom AI сургалт"],
                  missing: [],
                  color: "bg-slate-900",
                  textColor: "text-white"
                }
              ].map((plan, i) => (
                <div key={i} className={`relative p-8 rounded-[32px] border-2 transition-all shadow-sm flex flex-col ${plan.color} ${plan.textColor} ${plan.popular ? 'border-[#0052FF] scale-105 shadow-blue-200 shadow-xl z-10' : 'border-transparent'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                      Шилдэг сонголт
                    </div>
                  )}
                  <h4 className="text-xl font-black mb-2">{plan.name}</h4>
                  <p className="text-3xl font-black mb-6">{plan.price} <span className="text-xs opacity-60 font-bold">/ сар</span></p>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs font-bold">
                        <CheckCircle2 className={`w-4 h-4 ${plan.textColor === 'text-white' ? 'text-white' : 'text-green-500'}`} />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs font-bold opacity-40">
                        <X className="w-4 h-4" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  
                  <button className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${plan.popular ? 'bg-white text-[#0052FF]' : plan.textColor === 'text-white' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#0052FF] text-white'}`}>
                    {plan.name === "Үнэгүй" ? "Үнэгүй эхлэх" : "Туршиж үзэх"}
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100">
              <p className="text-sm font-bold text-blue-900 text-center">
                💡 Жилийн төлөвлөгөө сонговол илүү хэмнэлттэй байх болно. Картаар болон QPay-ээр төлөх боломжтой.
              </p>
            </div>
          </div>
        )
      }
    };

    const current = contentMap[activeContent as string] || { title: "Мэдээлэл", icon: FileText, text: <p>Мэдээлэл бэлтгэгдэж байна...</p> };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen pt-32 pb-20 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => setActiveContent(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#0052FF] font-black uppercase tracking-widest text-xs mb-12 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Буцах</span>
          </button>

          <div className="flex items-center gap-6 mb-16">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-50">
              <current.icon className="w-10 h-10 text-[#0052FF]" />
            </div>
            <h2 className="text-6xl font-black tracking-tighter text-slate-900">{current.title}</h2>
          </div>

          <div className="prose prose-slate max-w-none mb-24">
            {current.text}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-slate-100">
            <button 
              onClick={() => setActiveContent(null)}
              className="bg-slate-100 text-slate-600 px-16 py-6 rounded-2xl font-black text-xl hover:bg-slate-200 transition-all"
            >
              Буцах
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const compressImage = (base64: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 0.7 quality
      };
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setUserAvatar(compressed);
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { avatar: compressed }, { merge: true });
        }
        toast.success("Аватар амжилттай солигдлоо!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const nick = formData.get('profile-nick') as string;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        nickname: nick,
        avatar: userAvatar,
        email: user.email,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      toast.success("Мэдээлэл амжилттай хадгалагдлаа!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const suggestName = () => {
    const names = ["Тэмүүлэн", "Энхжин", "Анужин", "Бат-Эрдэнэ", "Цэцэгээ", "Мөнх-Очир", "Солонго", "Алтанхуяг"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setLoginName(randomName);
    toast.info(`"${randomName}" нэрийг санал болголоо ✨`);
  };

  const renderLoginModal = () => (
    <AnimatePresence>
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoginModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
                  <Mic2 className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter">ayalga</span>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                <button 
                  onClick={() => setLoginTab('login')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${loginTab === 'login' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Нэвтрэх
                </button>
                <button 
                  onClick={() => setLoginTab('register')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${loginTab === 'register' ? 'bg-white text-[#0052FF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Үнэгүй эхлэх
                </button>
              </div>

                <form onSubmit={loginTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {loginTab === 'register' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Таны нэр</label>
                    <div className="relative group flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#0052FF] transition-colors" />
                        <input 
                          name="nickname"
                          type="text" 
                          required
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          placeholder="Тэмүүлэн..."
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-[#0052FF] focus:bg-white font-bold text-sm transition-all"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={suggestName}
                        className="px-4 bg-slate-50 border-2 border-transparent rounded-2xl hover:border-blue-100 hover:bg-white transition-all text-[#0052FF]"
                        title="Нэр санал болгох"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Имэйл хаяг</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#0052FF] transition-colors" />
                    <input 
                      name="email"
                      type="email" 
                      required
                      placeholder="example@mail.com"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-[#0052FF] focus:bg-white font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Нууц үг</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#0052FF] transition-colors" />
                    <input 
                      name="password"
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-[#0052FF] focus:bg-white font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{loginTab === 'login' ? 'Нэвтрэх' : 'Үнэгүй эхлэх'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Эсвэл эдгээрээр нэвтрэх</p>
                <div className="flex justify-center gap-6">
                  <motion.button 
                    whileHover={{ y: -5, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-transparent hover:border-[#0052FF]/20 hover:bg-white transition-all shadow-sm group"
                  >
                    <Chrome className="w-6 h-6 text-blue-500" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ y: -5, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toast.info("Facebook-ээр нэвтрэх боломж удахгүй ирнэ.")}
                    type="button"
                    className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-transparent hover:border-[#0052FF]/20 hover:bg-white transition-all shadow-sm group"
                  >
                    <Facebook className="w-6 h-6 text-blue-600" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ y: -5, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toast.info("Instagram-аар нэвтрэх боломж удахгүй ирнэ.")}
                    type="button"
                    className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-transparent hover:border-[#0052FF]/20 hover:bg-white transition-all shadow-sm group"
                  >
                    <Instagram className="w-6 h-6 text-pink-500" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };

  const SidebarItem = ({ icon: Icon, label, active, hasSubmenu, isExpanded, onClick, isOpen, badge, badgeColor }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`} />
        {isOpen && <span className="font-bold text-sm">{label}</span>}
      </div>
      {isOpen && (
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor || 'bg-blue-100 text-[#0052FF]'}`}>
              {badge}
            </span>
          )}
          {hasSubmenu && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </div>
      )}
    </button>
  );

  const renderSidebar = () => (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className="fixed left-0 top-0 bottom-0 bg-[#F8F9FA] border-r border-slate-200 z-[60] overflow-hidden flex flex-col"
    >
      <div className="p-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
          <div className="grid grid-cols-2 gap-0.5">
            {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-white/40 rounded-sm" />)}
          </div>
        </div>
        {isSidebarOpen && <span className="text-xl font-black tracking-tighter text-slate-900">ayalga</span>}
      </div>

      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Хянах самбар" 
          active={activeSidebarItem === 'dashboard'} 
          onClick={() => setActiveSidebarItem('dashboard')}
          isOpen={isSidebarOpen}
        />
        
        <div className="space-y-1">
          <SidebarItem 
            icon={Package} 
            label="Боломжууд" 
            hasSubmenu 
            isExpanded={expandedMenus.includes('product')}
            onClick={() => toggleMenu('product')}
            isOpen={isSidebarOpen}
          />
          
          <AnimatePresence>
            {isSidebarOpen && expandedMenus.includes('product') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-9 pl-4 border-l border-slate-200 space-y-1 relative"
              >
                {[
                  { id: 'overview', label: 'Тойм' },
                  { id: 'drafts', label: 'Ноорог', badge: '3', badgeColor: 'bg-[#FFBC99]' },
                  { id: 'released', label: 'Нийтлэгдсэн' },
                  { id: 'comments', label: 'Сэтгэгдэл' },
                  { id: 'pricing', label: 'Төлөвлөгөө', badge: '8', badgeColor: 'bg-[#B5E4CA]' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setActiveSidebarItem(sub.id);
                      if (sub.id === 'overview') setActiveContent(null);
                      else setActiveContent(sub.id as any);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between relative group ${activeSidebarItem === sub.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <div className={`absolute -left-[17px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors ${activeSidebarItem === sub.id ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-slate-400'}`} />
                    <span>{sub.label}</span>
                    {sub.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${sub.badgeColor} text-slate-900`}>
                        {sub.badge}
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SidebarItem 
          icon={Users} 
          label="Хэрэглэгчид" 
          active={activeSidebarItem === 'users'} 
          onClick={() => setActiveSidebarItem('users')}
          isOpen={isSidebarOpen}
          hasSubmenu
        />
        <SidebarItem 
          icon={Calendar} 
          label="Төлөвлөгөө" 
          active={activeSidebarItem === 'schedule'} 
          onClick={() => setActiveSidebarItem('schedule')}
          isOpen={isSidebarOpen}
        />
        <SidebarItem 
          icon={Wallet} 
          label="Орлого" 
          active={activeSidebarItem === 'income'} 
          onClick={() => setActiveSidebarItem('income')}
          isOpen={isSidebarOpen}
          hasSubmenu
        />
        <SidebarItem 
          icon={GraduationCap} 
          label="Сургалчилгаа" 
          active={activeSidebarItem === 'training'} 
          onClick={() => setActiveSidebarItem('training')}
          isOpen={isSidebarOpen}
        />
      </div>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 rounded-xl hover:bg-white transition-all flex items-center justify-center text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className={`w-5 h-5 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.aside>
  );

  const renderTopNav = () => {
    const getTitle = (id: string) => {
      const titles: Record<string, string> = {
        'dashboard': 'Хянах самбар',
        'overview': 'Тойм',
        'drafts': 'Ноорог',
        'released': 'Нийтлэгдсэн',
        'comments': 'Сэтгэгдэл',
        'pricing': 'Төлөвлөгөө',
        'users': 'Хэрэглэгчид',
        'schedule': 'Төлөвлөгөө',
        'income': 'Орлого',
        'training': 'Сургалчилгаа'
      };
      return titles[id] || id;
    };

    return (
      <header className="fixed top-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 flex items-center px-8 transition-all" style={{ left: isSidebarOpen ? 280 : 80 }}>
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl font-black text-slate-900">{getTitle(activeSidebarItem)}</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Хайх..." 
                className="w-80 pl-12 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-transparent outline-none focus:border-[#0052FF]/20 focus:bg-white transition-all text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDMGView(true)}
                className="px-6 py-2.5 bg-[#1E1E1E] text-white rounded-2xl text-sm font-black flex items-center gap-2 shadow-lg shadow-black/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Үүсгэх</span>
              </motion.button>

              <div className="flex items-center gap-1 px-2 border-x border-slate-100">
                <button className="p-2.5 text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 rounded-xl transition-all relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 rounded-xl transition-all">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveContent('profile')}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100"
              >
                <img src={isRegistered ? userAvatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>
    );
  };

  const renderSettingsModal = () => (
    <AnimatePresence>
      {showSettingsModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-[24px] shadow-2xl overflow-hidden border border-white/10 text-white"
          >
            {/* macOS Window Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#2D2D2D] border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] cursor-pointer" onClick={() => setShowSettingsModal(false)} />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <span className="text-sm font-bold text-slate-400">Тохиргоо</span>
              <div className="w-12" />
            </div>

            {/* Tabs */}
            <div className="flex justify-center bg-[#2D2D2D] p-1 gap-1">
              {[
                { id: 'general', label: 'Ерөнхий', icon: Monitor },
                { id: 'shortcuts', label: 'Төвчлүүр', icon: Keyboard },
                { id: 'audio', label: 'Аудио', icon: Volume2 },
                { id: 'history', label: 'Түүх', icon: History },
                { id: 'integrations', label: 'Холболт', icon: Cloud }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${settingsTab === tab.id ? 'bg-[#4A4A4A] text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8 min-h-[400px]">
              {settingsTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold mb-4">Ерөнхий</h3>
                  <div className="bg-[#2D2D2D] rounded-2xl overflow-hidden divide-y divide-white/5">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Нэвтэрсэн</span>
                      </div>
                      <button className="px-3 py-1 bg-[#3D3D3D] rounded-lg text-[10px] font-bold hover:bg-[#4D4D4D] transition-colors">Гарах</button>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Эрх идэвхтэй</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Автоматаар текст оруулах</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-sm font-medium">Микрофон</span>
                      </div>
                      <button className="px-3 py-1 bg-[#3D3D3D] rounded-lg text-[10px] font-bold hover:bg-[#4D4D4D] transition-colors">Зөвшөөрөх</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Цэг, таслал нэмэх</span>
                      <button 
                        onClick={() => setAddPunctuation(!addPunctuation)}
                        className={`w-10 h-5 rounded-full transition-all relative ${addPunctuation ? 'bg-blue-500' : 'bg-[#3D3D3D]'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${addPunctuation ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Дуут мэдэгдэл</span>
                      <button 
                        onClick={() => setVoiceNotifications(!voiceNotifications)}
                        className={`w-10 h-5 rounded-full transition-all relative ${voiceNotifications ? 'bg-blue-500' : 'bg-[#3D3D3D]'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${voiceNotifications ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Flow Bar харуулах</span>
                      <button 
                        onClick={() => setShowFlowBar(!showFlowBar)}
                        className={`w-10 h-5 rounded-full transition-all relative ${showFlowBar ? 'bg-blue-500' : 'bg-[#3D3D3D]'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${showFlowBar ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Flow Bar байрлал</span>
                      <div className="flex bg-[#2D2D2D] p-1 rounded-lg gap-1">
                        <button 
                          onClick={() => setFlowBarPosition('bottom')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${flowBarPosition === 'bottom' ? 'bg-[#4A4A4A] text-white' : 'text-slate-400'}`}
                        >
                          Доор
                        </button>
                        <button 
                          onClick={() => setFlowBarPosition('top')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${flowBarPosition === 'top' ? 'bg-[#4A4A4A] text-white' : 'text-slate-400'}`}
                        >
                          Дээр
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'shortcuts' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Төвчлүүр сонгох</h3>
                    <div className="bg-[#2D2D2D] rounded-2xl overflow-hidden divide-y divide-white/5">
                      {[
                        'Control + Option',
                        'Command + Shift',
                        'Control + Shift',
                        'Option + Shift'
                      ].map((shortcut) => (
                        <button
                          key={shortcut}
                          onClick={() => setSelectedShortcut(shortcut)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedShortcut === shortcut ? 'border-blue-500' : 'border-slate-600'}`}>
                              {selectedShortcut === shortcut && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                            <span className="text-sm font-mono">{shortcut}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Харагдац</h3>
                    <div className="bg-[#2D2D2D] p-6 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-500" /> : <Sun className="w-5 h-5 text-blue-500" />}
                        <span className="text-sm font-bold text-white">Харанхуй горим</span>
                      </div>
                      <button 
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-blue-500' : 'bg-slate-600'}`}
                      >
                        <motion.div 
                          animate={{ x: theme === 'dark' ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Горим</h3>
                    <div className="bg-[#2D2D2D] p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-500">Бичлэг горим</h4>
                      {[
                        'Hold to Talk',
                        'Press to Toggle',
                        'Hands-Free'
                      ].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setRecordingMode(mode)}
                          className="w-full flex items-center gap-3"
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${recordingMode === mode ? 'border-blue-500' : 'border-slate-600'}`}>
                            {recordingMode === mode && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          <span className="text-sm">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'history' && (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Хайх..." 
                      className="w-full pl-12 pr-4 py-3 bg-[#2D2D2D] rounded-xl border border-white/5 outline-none focus:border-blue-500/50 transition-all text-sm"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-[#2D2D2D] flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Түүх хоосон</h4>
                    <p className="text-sm text-center max-w-xs">Та {selectedShortcut} дарж ярьснаар энд хадгалагдана.</p>
                    <p className="text-[10px] mt-8 uppercase tracking-widest">0 бичлэг</p>
                  </div>
                </div>
              )}

              {settingsTab === 'integrations' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Үүлэн хадгаламж</h3>
                    <div className="bg-[#2D2D2D] p-6 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                          <Cloud className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Google Drive</h4>
                          <p className="text-xs text-slate-400">Транскрипци болон аудиог шууд хадгалах</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleGoogleConnect}
                        disabled={isConnectingDrive}
                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${googleTokens ? 'bg-green-500/20 text-green-500' : 'bg-[#0052FF] text-white hover:brightness-110'}`}
                      >
                        {isConnectingDrive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : googleTokens ? (
                          'Холбогдсон'
                        ) : (
                          'Холбох'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const handleDownload = (platform: 'mac' | 'windows') => {
    setInstallerPlatform(platform);
    setIsDownloading(true);
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setShowDMGView(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const renderDownloadProgress = () => (
    <AnimatePresence>
      {isDownloading && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md bg-[#1E1E1E] p-10 rounded-[32px] border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-[#0052FF] rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Download className="text-white w-10 h-10 animate-bounce" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white mb-2">Ayalga {installerPlatform === 'mac' ? 'macOS' : 'Windows'} татаж авч байна</h3>
                <p className="text-slate-400 text-sm font-medium">Түр хүлээнэ үү...</p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  className="h-full bg-[#0052FF] shadow-[0_0_20px_rgba(0,82,255,0.5)]"
                />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{downloadProgress}%</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderSetupWizard = () => (
    <AnimatePresence>
      {showSetupWizard && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl bg-[#1E1E1E] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-10">
              {setupStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <Mic className="text-blue-500 w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-4">Микрофон зөвшөөрөх</h3>
                    <p className="text-slate-400 leading-relaxed">Ayalga AI таны яриаг бичвэр болгохын тулд микрофон ашиглах зөвшөөрөл шаардлагатай.</p>
                  </div>
                  <button 
                    onClick={() => setSetupStep(2)}
                    className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Зөвшөөрөх
                  </button>
                </motion.div>
              )}

              {setupStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <Keyboard className="text-blue-500 w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-4">Төвчлүүр тохируулах</h3>
                    <p className="text-slate-400 leading-relaxed">Аппликейшнийг хаанаас ч шууд ажиллуулах товчлуураа сонгоно уу.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {['Command + Shift', 'Control + Option', 'Option + Shift'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setSelectedShortcut(s)}
                        className={`p-4 rounded-xl border-2 transition-all text-left font-mono text-sm ${selectedShortcut === s ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 text-slate-400 hover:border-white/10'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setSetupStep(3)}
                    className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-blue-500/20"
                  >
                    Үргэлжлүүлэх
                  </button>
                </motion.div>
              )}

              {setupStep === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8 text-center"
                >
                  <div className="w-24 h-24 bg-green-500/10 rounded-[32px] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="text-green-500 w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-4">Бүх зүйл бэлэн!</h3>
                    <p className="text-slate-400 leading-relaxed">Ayalga AI амжилттай суурилагдлаа. Одоо та {selectedShortcut} дарж яриагаа эхлэх боломжтой.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSetupWizard(false);
                      toast.success("Ayalga AI ашиглахад бэлэн боллоо!");
                    }}
                    className="w-full py-5 bg-green-500 text-white rounded-2xl font-black text-lg hover:brightness-110 transition-all shadow-xl shadow-green-500/20"
                  >
                    Эхлэх
                  </button>
                </motion.div>
              )}
            </div>
            <div className="px-10 py-6 bg-white/5 flex justify-between items-center">
              <div className="flex gap-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${setupStep === i ? 'bg-blue-500 w-6' : 'bg-white/20'}`} />
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Алхам {setupStep}/3</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderOverview = () => (
    <div className="p-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF2FF] text-[#0052FF] rounded-full text-xs font-black uppercase tracking-widest"
            >
              <Sparkles className="w-4 h-4" />
              <span>монгол хэлний хамгийн дэвшилтэт AI</span>
            </motion.div>
            
            <h1 className="text-7xl font-black tracking-tighter text-slate-900 leading-[1.1]">
              Дуу хоолойгоо <br/>
              <span className="text-[#0052FF]">Ухаалгаар</span> <br/>
              Удирдах Цаг
            </h1>
            
            <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">
              Аялга AI бол Монгол хэлний яриаг бичвэр болгох (ASR) desktop програм юм. 
              Товчлуур дарж, Монголоор ярихад текстийг автоматаар таньж идэвхтэй програм руу бичигдэнэ.
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="px-10 py-5 bg-[#0052FF] text-white rounded-[24px] font-black flex items-center gap-4 shadow-2xl shadow-blue-500/20 text-lg group"
            >
              <Mic className="w-6 h-6" />
              <span>Одоо эхлэх</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <div className="space-y-4 pt-8">
              {[
                { icon: ImageIcon, label: "AI Аватар Үүсгэгч", color: "bg-blue-50 text-blue-500" },
                { icon: Youtube, label: "YouTube Subtitle Татагч", color: "bg-blue-50 text-blue-500" },
                { icon: Type, label: "Үгийн алдаа шалгуур", color: "bg-blue-50 text-blue-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-slate-900 font-black">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1 flex justify-center">
            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full"></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="relative w-[340px] aspect-[1/2] bg-white rounded-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-[12px] border-slate-900 overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-20"></div>
              
              <div className="p-8 pt-12 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">өдрийн мэнд,</p>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">{isRegistered ? userNickname : "ЗОЧИН"}</h3>
                    <p className="text-[10px] font-bold text-blue-500">Аялга AI-д өрж ирсэнд баярлалаа.</p>
                  </div>
                  <img 
                    src={isRegistered ? userAvatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                    className="w-12 h-12 rounded-2xl shadow-lg"
                    alt="Avatar"
                  />
                </div>

                <div className="bg-[#0052FF] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                  <p className="text-[10px] font-bold opacity-50 mb-2 uppercase tracking-widest">ҮЛДЭСНЭ МИНУТ</p>
                  <h3 className="text-5xl font-black mb-8">120:00</h3>
                  
                  <div className="space-y-4">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        className="h-full bg-white rounded-full relative"
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
                      </motion.div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] font-black">75%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">СҮҮЛИЙН БИЧЛЭГҮҮД</h4>
                    <button className="text-[10px] font-black text-blue-500 uppercase">БҮГД</button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { title: "Төслийн уулзалт.wav", time: "Өнөөдөр, 14:30", duration: "3:24" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-black text-slate-900">{item.title}</h5>
                          <p className="text-[10px] font-bold text-slate-400">{item.time}</p>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{item.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

              {/* Quick Start Guide - Sequential & Tidy */}
              <div className="mb-20">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight dark:text-white">Хэрхэн ашиглах вэ?</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">3 хялбар алхмаар ажлаа эхлээрэй.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { 
                      step: "01", 
                      title: "Аудио оруулах", 
                      desc: "Микрофон ашиглан шууд ярих эсвэл аудио файлаа хуулж оруулна уу.", 
                      icon: Mic2,
                      color: "bg-blue-500"
                    },
                    { 
                      step: "02", 
                      title: "AI Боловсруулалт", 
                      desc: "Манай AI таны яриаг 99.2% нарийвчлалтайгаар бичвэр болгон хөрвүүлнэ.", 
                      icon: Zap,
                      color: "bg-purple-500"
                    },
                    { 
                      step: "03", 
                      title: "Үр дүнг авах", 
                      desc: "Хөрвүүлсэн бичвэрээ засварлаж, орчуулж эсвэл шууд татаж аваарай.", 
                      icon: FileCheck,
                      color: "bg-green-500"
                    }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative group hover:border-[#0052FF] transition-all"
                    >
                      <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <span className="absolute top-8 right-8 text-4xl font-black text-slate-100 dark:text-slate-800 group-hover:text-blue-50 dark:group-hover:text-blue-900/20 transition-colors">
                        {item.step}
                      </span>
                      <h3 className="text-xl font-black mb-3 dark:text-white">{item.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Stats & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight dark:text-white">Сүүлийн бичлэгүүд</h2>
                    <button className="text-sm font-black text-[#0052FF] dark:text-blue-400 hover:underline">Бүгдийг үзэх</button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { title: "Хурлын тэмдэглэл - Даваа", time: "12:45 • 2.4 MB", status: "Дууссан", icon: FileText, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                      { title: "Ярилцлага_01_Төсөл", time: "Өчигдөр • 15.8 MB", status: "Хүлээгдэж буй", icon: Mic2, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                      { title: "Лекц - AI-ийн ирээдүй", time: "2 хоногийн өмнө • 45.2 MB", status: "Дууссан", icon: BookOpen, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ x: 10, backgroundColor: theme === 'dark' ? "#1E293B" : "#F8FAFC" }}
                        className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-lg transition-all">
                            <item.icon className="w-7 h-7 text-[#0052FF] dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{item.time}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${item.bg} ${item.color}`}>
                          {item.status}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h2 className="text-2xl font-black tracking-tight dark:text-white">Миний төлөв</h2>
                  <div className="bg-[#0F172A] dark:bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-800">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <p className="text-xs font-bold opacity-50 mb-2 uppercase tracking-widest">Үлдсэн минут</p>
                    <h3 className="text-5xl font-black mb-8">120:00</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                        <span>Ашигласан</span>
                        <span>75%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          className="h-full bg-[#0052FF] rounded-full"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveContent('pricing')}
                      className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all border border-white/10"
                    >
                      Хугацаа сунгах
                    </button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-[40px] p-8 border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-lg font-black text-blue-900 dark:text-blue-300 mb-4">Шинэ боломж!</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed mb-6">
                      Одоо та YouTube видеоны линкийг хуулж шууд хадмал татах боломжтой боллоо.
                    </p>
                    <button 
                      onClick={() => setActiveContent('youtube')}
                      className="text-sm font-black text-[#0052FF] dark:text-blue-400 flex items-center gap-2 hover:gap-3 transition-all"
                    >
                      Туршиж үзэх <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sequential Features Section - Refined */}
              <section id="features" className="py-32 px-6 bg-white dark:bg-slate-900 rounded-[60px] mt-20 border border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-24">
                    <h2 className="text-5xl font-black mb-6 tracking-tighter dark:text-white">Системийн боломжууд</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xl font-medium max-w-2xl mx-auto">Аялга AI-ийн санал болгож буй үндсэн функцууд.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { step: "01", title: "Аудио хөрвүүлэлт", desc: "Ямар ч төрлийн аудио файлыг 99.2% нарийвчлалтайгаар бичвэр болгон хөрвүүлнэ.", icon: Mic2, key: 'voice' },
                      { step: "02", title: "YouTube Хадмал", desc: "YouTube видеоны линкийг ашиглан шууд хадмал татаж авах боломжтой.", icon: Youtube, key: 'youtube' },
                      { step: "03", title: "Дүрмийн Шалгалт", desc: "Монгол хэлний зөв бичих дүрмийн алдааг AI-аар шалгаж засна.", icon: SpellCheck, key: 'spellcheck' },
                      { step: "04", title: "Ухаалаг Орчуулга", desc: "Дэлхийн 100 гаруй хэл рүү мэргэжлийн түвшинд орчуулга хийнэ.", icon: Languages, key: 'translate' },
                      { step: "05", title: "AI Аватар Үүсгэгч", desc: "Өөрийн хүссэнээр 3D аватар үүсгэж, профайл зургаа шинэчлэх боломжтой.", icon: ImageIcon, key: 'avatar-gen' },
                      { step: "06", title: "Найдвартай хадгалалт", desc: "Таны бүх өгөгдөл үүлэн технологид AES-256 нууцлалтайгаар хадгалагдана.", icon: Database, key: 'security' }
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => item.key && setActiveContent(item.key as any)}
                        className="flex items-center gap-8 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-[48px] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none transition-all group cursor-pointer"
                      >
                        <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-lg group-hover:bg-[#0052FF] group-hover:text-white transition-all">
                          <item.icon className="w-8 h-8 text-[#0052FF] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-black mb-2 dark:text-white group-hover:text-[#0052FF] transition-colors">{item.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                        <ArrowRight className="w-8 h-8 text-slate-200 group-hover:text-[#0052FF] group-hover:translate-x-2 transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="py-32 bg-white border-t border-slate-100 mt-20">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    <div className="col-span-1">
                      <div className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                          <Mic2 className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">ayalga</span>
                      </div>
                      <p className="text-slate-400 font-bold leading-relaxed mb-8">
                        Монгол хэлний хиймэл оюун ухааны технологийг дэлхийн түвшинд.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                          <Phone className="w-5 h-5 text-[#0052FF]" />
                        </div>
                        <p className="text-lg font-black text-slate-900">72126984</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-black mb-8 uppercase tracking-widest text-xs text-slate-900">Бүтээгдэхүүн</h5>
                      <ul className="space-y-4 text-slate-500 font-bold text-sm">
                        <li><button onClick={() => setActiveContent('features')} className="hover:text-[#0052FF] transition-colors">Боломжууд</button></li>
                        <li><button onClick={() => setActiveContent('pricing')} className="hover:text-[#0052FF] transition-colors">Төлөвлөгөө</button></li>
                        <li><button onClick={() => setActiveContent('security')} className="hover:text-[#0052FF] transition-colors">Аюулгүй байдал</button></li>
                        <li><button onClick={() => setActiveContent('versions')} className="hover:text-[#0052FF] transition-colors">Хувилбарууд</button></li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black mb-8 uppercase tracking-widest text-xs text-slate-900">Компани</h5>
                      <ul className="space-y-4 text-slate-500 font-bold text-sm">
                        <li><button onClick={() => setActiveContent('about')} className="hover:text-[#0052FF] transition-colors">Бидний тухай</button></li>
                        <li><button onClick={() => setActiveContent('careers')} className="hover:text-[#0052FF] transition-colors">Карьер</button></li>
                        <li><button onClick={() => setActiveContent('blog')} className="hover:text-[#0052FF] transition-colors">Блог</button></li>
                        <li><button onClick={() => setActiveContent('contact')} className="hover:text-[#0052FF] transition-colors">Холбоо барих</button></li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black mb-8 uppercase tracking-widest text-xs text-slate-900">Тусламж</h5>
                      <ul className="space-y-4 text-slate-500 font-bold text-sm">
                        <li><button onClick={() => setActiveContent('workflow')} className="hover:text-[#0052FF] transition-colors">Хэрхэн ашиглах вэ?</button></li>
                        <li><button onClick={() => setActiveContent('faq')} className="hover:text-[#0052FF] transition-colors">Түгээмэл асуултууд</button></li>
                        <li><button onClick={() => setActiveContent('privacy')} className="hover:text-[#0052FF] transition-colors">Нууцлалын бодлого</button></li>
                        <li><button onClick={() => setActiveContent('terms')} className="hover:text-[#0052FF] transition-colors">Үйлчилгээний нөхцөл</button></li>
                      </ul>
                    </div>
                  </div>
                  <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm font-bold text-slate-400">© 2026 Ayalga AI. Бүх эрх хуулиар хамгаалагдсан.</p>
                    <div className="flex gap-8">
                      {['Twitter', 'Facebook', 'LinkedIn'].map(social => (
                        <a key={social} href="#" className="text-slate-400 hover:text-[#0052FF] transition-colors font-bold text-sm uppercase tracking-widest">{social}</a>
                      ))}
                    </div>
                  </div>
                </div>
              </footer>
            </motion.div>
        ) : (
          <motion.div 
            key="coming-soon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-20 text-center">
              <h2 className="text-4xl font-black mb-4">Удахгүй ирнэ</h2>
              <p className="text-slate-500">Энэ хэсэг одоогоор бэлтгэгдэж байна.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>

      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-[#1E1E1E] px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 min-w-[480px] border border-white/5"
          >
            <div className="w-12 h-12 bg-[#0052FF] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mic className="text-white w-6 h-6" />
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              <p className="text-sm font-black text-white whitespace-nowrap">Бичиж байна...</p>
              <div className="flex items-center gap-1.5 h-8">
                {[...Array(16)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      height: [8, Math.random() * 24 + 8, 8],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5 + Math.random() * 0.5,
                      delay: i * 0.05 
                    }}
                    className="w-1 bg-blue-500 rounded-full"
                  />
                ))}
              </div>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex items-center gap-6">
              <span className="text-sm font-mono font-black text-slate-400">{recordingTime}</span>
              <button 
                onClick={stopRecording}
                className="px-6 py-2 bg-transparent border border-red-500/50 text-red-500 rounded-full text-xs font-black hover:bg-red-500 hover:text-white transition-all"
              >
                Зогсоох
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
