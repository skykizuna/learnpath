import React, { useState, useEffect } from 'react';
import { BookOpen, Target, MessageSquare, TrendingUp, Users, Plus, X, Send, CheckCircle, Circle, Home, MessageCircle, Wifi, WifiOff, Loader, Sparkles, GraduationCap, Globe, Zap, ArrowRight, Check, Settings, Trash2, LogOut, Upload, FileText, ExternalLink, Lightbulb, ArrowLeft } from 'lucide-react';
import { auth, db, isFirebaseConfigured, googleProvider, signInWithPopup } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { generateRoadmap, getTutorResponse } from './geminiService';

const LearnPath = () => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [learningGoals, setLearningGoals] = useState([]);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [tutorSpecialty, setTutorSpecialty] = useState('General Tutor');
  const [isOnline, setIsOnline] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Student',
    country: 'Malaysia',
    grade: 'Form 5',
    educationLevel: 'Secondary School'
  });

  // Gamification & Progress Tracking States 
  const [userStats, setUserStats] = useState({
    points: 0,
    level: 1,
    experience: 0,
    maxExperience: 500,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    totalLearningTime: 0,
    badgesEarned: [],
    goalsCompleted: 0,
    stepsCompleted: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const leaderboardItemsPerPage = 20;
  const [studyGroups, setStudyGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupLevel, setNewGroupLevel] = useState('');
  const [searchCommunity, setSearchCommunity] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [allCommunities, setAllCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityDocuments, setCommunityDocuments] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentsTab, setShowDocumentsTab] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentCategory, setDocumentCategory] = useState('Notes');
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Policy and Instructions
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [policyCheckbox, setPolicyCheckbox] = useState(false);

  // Time tracking for learning
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Study Sessions Feature
  const [studySessions, setStudySessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [showEditMeetingLinkModal, setShowEditMeetingLinkModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCommunity, setSessionCommunity] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionMeetingLink, setSessionMeetingLink] = useState('');
  const [editingMeetingLink, setEditingMeetingLink] = useState('');
  const [sessionChatInput, setSessionChatInput] = useState('');
  const [searchSessions, setSearchSessions] = useState('');
  const [filterSessionCommunity, setFilterSessionCommunity] = useState('All');
  const [sortSessions, setSortSessions] = useState('newest');
  const [sessionPage, setSessionPage] = useState(1);

  // Resource viewer state
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourcePage, setShowResourcePage] = useState(false);


  // Point system configuration
  const POINT_SYSTEM = {
    CREATE_GOAL: 50,
    COMPLETE_STEP: 25,
    COMPLETE_GOAL: 200,
    TUTOR_MESSAGE: 5,
    COMMUNITY_POST: 10,
    DOCUMENT_UPLOAD: 15,
    JOIN_COMMUNITY: 20,
    DAILY_LOGIN: 10,
    STREAK_BONUS: 5, // Per day in streak
    WEEKLY_GOAL_COMPLETION: 100
  };

  const ACHIEVEMENT_BADGES = [
    { id: 'first_goal', name: 'Goal Setter', description: 'Create your first learning goal', icon: '🎯', points: 50, criteria: { type: 'goals_created', value: 1 } },
    { id: 'step_complete', name: 'Step Forward', description: 'Complete 5 learning steps', icon: '📚', points: 25, criteria: { type: 'steps_completed', value: 5 } },
    { id: 'goal_master', name: 'Goal Master', description: 'Complete 3 learning goals', icon: '🏆', points: 200, criteria: { type: 'goals_completed', value: 3 } },
    { id: 'chat_warrior', name: 'Chat Warrior', description: 'Have 10 AI Tutor conversations', icon: '💬', points: 50, criteria: { type: 'messages_sent', value: 10 } },
    { id: 'community_star', name: 'Community Star', description: 'Create 3 posts in communities', icon: '⭐', points: 75, criteria: { type: 'posts_created', value: 3 } },
    { id: 'fire_streak', name: 'On Fire!', description: 'Maintain a 7-day streak', icon: '🔥', points: 150, criteria: { type: 'streak', value: 7 } },
    { id: 'doc_master', name: 'Knowledge Sharer', description: 'Upload 5 documents', icon: '📄', points: 100, criteria: { type: 'documents_uploaded', value: 5 } },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Join 5 different communities', icon: '🦋', points: 125, criteria: { type: 'communities_joined', value: 5 } },
    { id: 'speed_learner', name: 'Speed Learner', description: 'Complete a goal in under 2 weeks', icon: '⚡', points: 175, criteria: { type: 'speed_goal_completion', value: 1 } },
    { id: 'legend', name: 'LearnPath Legend', description: 'Earn 2000 points', icon: '👑', points: 500, criteria: { type: 'total_points', value: 2000 } }
  ];

  // Listen for auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsAuthLoading(false);
      setHasStarted(true); // Allow local-only usage
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadProfileFromFirestore(currentUser.uid);
        await loadGoalsFromFirestore(currentUser.uid);
        setHasStarted(true);
      } else {
        setUser(null);
        setHasStarted(false);
      }
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load communities when user logs in
  useEffect(() => {
    if (user && isFirebaseConfigured) {
      loadStudyGroups(user.uid);
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Time tracking effect - tracks learning time when user is actively learning
  useEffect(() => {
    // Start tracking when user is in roadmap or tutor view
    if (currentView === 'roadmap' || currentView === 'tutor') {
      if (!isLearningActive) {
        setIsLearningActive(true);
        setSessionStartTime(Date.now());
      }
    } else {
      // Stop tracking when user leaves learning views
      if (isLearningActive && sessionStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        if (elapsedSeconds >= 60) { // Only count if at least 1 minute has passed
          setUserStats(prev => ({
            ...prev,
            totalLearningTime: (prev.totalLearningTime || 0) + elapsedSeconds
          }));

          // Save to Firebase
          if (user && isFirebaseConfigured) {
            const statsRef = doc(db, 'users', user.uid, 'stats', 'overview');
            setDoc(statsRef, { totalLearningTime: (userStats.totalLearningTime || 0) + elapsedSeconds }, { merge: true }).catch(err => console.error('Error updating learning time:', err));
          }
        }
      }
      setIsLearningActive(false);
      setSessionStartTime(null);
    }
  }, [currentView]);

  // Update learning time every minute while actively learning
  useEffect(() => {
    if (!isLearningActive) return;

    const interval = setInterval(() => {
      if (sessionStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        setUserStats(prev => ({
          ...prev,
          totalLearningTime: (prev.totalLearningTime || 0) + 60 // Add 1 minute
        }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isLearningActive, sessionStartTime]);


  // Authentication functions
  const handleSignUp = async () => {
    if (!authEmail || !authPassword || !authName) {
      setAuthError('Please fill in all fields');
      return;
    }

    setIsAuthProcessing(true);
    setAuthError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const newUser = userCredential.user;

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        name: authName,
        email: authEmail,
        country: 'Malaysia',
        grade: 'Form 5',
        educationLevel: 'Secondary School',
        createdAt: new Date(),
        updatedAt: new Date(),
        policyAccepted: false,
        policyAcceptedDate: null
      });

      // Initialize user stats
      await setDoc(doc(db, 'users', newUser.uid, 'stats', 'overview'), {
        points: 0,
        level: 1,
        experience: 0,
        maxExperience: 500,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        lastLoginDate: new Date().toDateString(),
        totalLearningTime: 0,
        badgesEarned: [],
        goalsCreated: 0,
        goalsCompleted: 0,
        stepsCompleted: 0,
        messagesSent: 0,
        postsCreated: 0,
        documentsUploaded: 0,
        communitiesJoined: 0,
        createdAt: new Date()
      });

      setUser(newUser);
      setShowPolicyModal(true); // Show policy modal after signup
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setAuthMode('login');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLogin = async () => {
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password');
      return;
    }

    setIsAuthProcessing(true);
    setAuthError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setUser(userCredential.user);

      // Check if user accepted policy
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && !userDocSnap.data().policyAccepted) {
        setShowAuthModal(false);
        setShowPolicyModal(true);
      } else {
        setHasStarted(true);
        setShowAuthModal(false);
      }

      setAuthEmail('');
      setAuthPassword('');
      setAuthMode('login');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setLearningGoals([]);
      setChatMessages([]);
      setCurrentGoal(null);
      setCurrentView('home');
      setHasStarted(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthProcessing(true);
    setAuthError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const newUser = result.user;

      // Check if user profile exists, if not create it
      const userDocRef = doc(db, 'users', newUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const isNewUser = !userDocSnap.exists();

      if (isNewUser) {
        // Create new user profile with Google account info
        await setDoc(userDocRef, {
          name: newUser.displayName || 'Student',
          email: newUser.email,
          country: 'Malaysia',
          grade: 'Form 5',
          educationLevel: 'Secondary School',
          createdAt: new Date(),
          updatedAt: new Date(),
          policyAccepted: false,
          policyAcceptedDate: null
        });

        // Initialize user stats
        await setDoc(doc(db, 'users', newUser.uid, 'stats', 'overview'), {
          points: 0,
          level: 1,
          experience: 0,
          maxExperience: 500,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          lastLoginDate: new Date().toDateString(),
          totalLearningTime: 0,
          badgesEarned: [],
          goalsCreated: 0,
          goalsCompleted: 0,
          stepsCompleted: 0,
          messagesSent: 0,
          postsCreated: 0,
          documentsUploaded: 0,
          communitiesJoined: 0,
          createdAt: new Date()
        });
      }

      setUser(newUser);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthMode('login');

      // Check policy acceptance
      const userData = isNewUser ? null : userDocSnap.data();
      if (!isNewUser && !userData?.policyAccepted) {
        setShowPolicyModal(true);
      } else if (isNewUser) {
        setShowPolicyModal(true);
      } else {
        setHasStarted(true);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const acceptPolicy = async () => {
    if (!user || !policyCheckbox || !isFirebaseConfigured) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        policyAccepted: true,
        policyAcceptedDate: new Date()
      });

      setAcceptedPolicy(true);
      setShowPolicyModal(false);
      setHasStarted(true);
      setPolicyCheckbox(false);
      await recordDailyLogin(user.uid);
    } catch (error) {
      console.error('Error accepting policy:', error);
    }
  };

  // Gamification & Achievements System
  const BADGES = {
    firstGoal: { id: 'firstGoal', name: 'Goal Setter', description: 'Create your first learning goal', icon: '🎯', points: 50 },
    firstStep: { id: 'firstStep', name: 'First Step', description: 'Complete your first roadmap step', icon: '👣', points: 25 },
    streak7: { id: 'streak7', name: 'Week Warrior', description: 'Maintain a 7-day learning streak', icon: '🔥', points: 100 },
    streak30: { id: 'streak30', name: 'Legend', description: 'Maintain a 30-day learning streak', icon: '👑', points: 500 },
    complete5Goals: { id: 'complete5Goals', name: 'Goal Master', description: 'Complete 5 learning goals', icon: '🏆', points: 300 },
    complete50Steps: { id: 'complete50Steps', name: 'Step Climber', description: 'Complete 50 roadmap steps', icon: '🪜', points: 250 },
    perfect100: { id: 'perfect100', name: 'Perfect Score', description: 'Complete a goal with 100% progress', icon: '💯', points: 150 },
    teacher: { id: 'teacher', name: 'Teacher', description: 'Help 5 learners in a study group', icon: '👨‍🏫', points: 200 }
  };

  const checkAndAwardAchievements = async (userId) => {
    if (!user || !isFirebaseConfigured) return;

    try {
      const statsRef = doc(db, 'users', userId, 'stats', 'overview');
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.exists() ? statsSnap.data() : userStats;
      let newBadges = [...(currentStats.badgesEarned || [])];
      let pointsGained = 0;

      // Achievement badge checking
      ACHIEVEMENT_BADGES.forEach(badge => {
        if (newBadges.some(b => b.id === badge.id)) return; // Already earned

        let shouldAward = false;

        switch (badge.criteria.type) {
          case 'goals_created':
            shouldAward = (currentStats.goalsCreated || 0) >= badge.criteria.value;
            break;
          case 'steps_completed':
            shouldAward = (currentStats.stepsCompleted || 0) >= badge.criteria.value;
            break;
          case 'goals_completed':
            shouldAward = (currentStats.goalsCompleted || 0) >= badge.criteria.value;
            break;
          case 'messages_sent':
            shouldAward = (currentStats.messagesSent || 0) >= badge.criteria.value;
            break;
          case 'posts_created':
            shouldAward = (currentStats.postsCreated || 0) >= badge.criteria.value;
            break;
          case 'streak':
            shouldAward = (currentStats.currentStreak || 0) >= badge.criteria.value;
            break;
          case 'documents_uploaded':
            shouldAward = (currentStats.documentsUploaded || 0) >= badge.criteria.value;
            break;
          case 'communities_joined':
            shouldAward = (currentStats.communitiesJoined || 0) >= badge.criteria.value;
            break;
          case 'speed_goal_completion':
            shouldAward = (currentStats.speedGoalCompletions || 0) >= badge.criteria.value;
            break;
          case 'total_points':
            shouldAward = (currentStats.points || 0) >= badge.criteria.value;
            break;
          default:
            break;
        }

        if (shouldAward) {
          newBadges.push(badge.id);
          pointsGained += badge.points;
        }
      });

      if (pointsGained > 0 || newBadges.length > (currentStats.badgesEarned || []).length) {
        const updatedStats = {
          ...currentStats,
          points: (currentStats.points || 0) + pointsGained,
          badgesEarned: newBadges
        };

        await setDoc(statsRef, updatedStats);
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const awardPoints = async (pointType, userId = user?.uid) => {
    if (!userId || !isFirebaseConfigured) return;

    try {
      const statsRef = doc(db, 'users', userId, 'stats', 'overview');
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.exists() ? statsSnap.data() : userStats;

      const pointsToAward = POINT_SYSTEM[pointType] || 0;
      if (pointsToAward === 0) return;

      // Update stats based on point type
      let statUpdate = {
        points: (currentStats.points || 0) + pointsToAward,
        experience: (currentStats.experience || 0) + pointsToAward
      };

      // Track specific metrics
      if (pointType === 'CREATE_GOAL') statUpdate.goalsCreated = (currentStats.goalsCreated || 0) + 1;
      if (pointType === 'COMPLETE_STEP') statUpdate.stepsCompleted = (currentStats.stepsCompleted || 0) + 1;
      if (pointType === 'COMPLETE_GOAL') statUpdate.goalsCompleted = (currentStats.goalsCompleted || 0) + 1;
      if (pointType === 'TUTOR_MESSAGE') statUpdate.messagesSent = (currentStats.messagesSent || 0) + 1;
      if (pointType === 'COMMUNITY_POST') statUpdate.postsCreated = (currentStats.postsCreated || 0) + 1;
      if (pointType === 'DOCUMENT_UPLOAD') statUpdate.documentsUploaded = (currentStats.documentsUploaded || 0) + 1;
      if (pointType === 'JOIN_COMMUNITY') statUpdate.communitiesJoined = (currentStats.communitiesJoined || 0) + 1;

      // Level up when experience exceeds threshold
      const currentLevel = currentStats.level || 1;
      const maxExp = currentStats.maxExperience || 500;
      if (statUpdate.experience >= maxExp) {
        statUpdate.level = currentLevel + 1;
        statUpdate.experience = 0;
        statUpdate.maxExperience = maxExp + 500;
      }

      // Update in Firestore
      await setDoc(statsRef, { ...currentStats, ...statUpdate }, { merge: true });
      setUserStats(prev => ({ ...prev, ...statUpdate }));

      // Check for new achievements
      await checkAndAwardAchievements(userId);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const recordDailyLogin = async (userId) => {
    if (!userId || !isFirebaseConfigured) return;

    try {
      const statsRef = doc(db, 'users', userId, 'stats', 'overview');
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.exists() ? statsSnap.data() : userStats;

      const today = new Date().toDateString();
      const lastLogin = currentStats.lastLoginDate;

      if (lastLogin !== today) {
        const pointsToAward = POINT_SYSTEM.DAILY_LOGIN;
        await setDoc(statsRef, {
          ...currentStats,
          lastLoginDate: today,
          points: (currentStats.points || 0) + pointsToAward,
          experience: (currentStats.experience || 0) + pointsToAward,
          loginStreak: lastLogin === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()
            ? (currentStats.loginStreak || 0) + 1
            : 1
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error recording daily login:', error);
    }
  };

  const updateStreak = async (userId) => {
    if (!user || !isFirebaseConfigured) return;

    try {
      const statsRef = doc(db, 'users', userId, 'stats', 'overview');
      const today = new Date().toDateString();
      const statsSnap = await getDoc(statsRef);
      const currentStats = statsSnap.exists() ? statsSnap.data() : userStats;

      const lastActivityDate = currentStats.lastActivityDate;
      const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toDateString();

      let newStreak = currentStats.currentStreak || 0;
      let longestStreak = currentStats.longestStreak || 0;

      if (lastActivityDate !== today) {
        if (lastActivityDate === yesterday) {
          newStreak += 1;
        } else {
          longestStreak = Math.max(longestStreak, newStreak);
          newStreak = 1;
        }

        const updatedStats = {
          ...currentStats,
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastActivityDate: today
        };

        await setDoc(statsRef, updatedStats);
        setUserStats(updatedStats);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const loadUserStats = async (userId) => {
    try {
      const statsRef = doc(db, 'users', userId, 'stats', 'overview');
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        setUserStats(statsSnap.data());
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Firebase Firestore functions
  const loadProfileFromFirestore = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          name: data.name || 'Student',
          country: data.country || 'Malaysia',
          grade: data.grade || 'Form 5',
          educationLevel: data.educationLevel || 'Secondary School'
        });
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setShowProfileSetup(true);
    }
  };

  const loadGoalsFromFirestore = async (userId) => {
    setIsLoadingGoals(true);
    try {
      const goalsRef = collection(db, 'users', userId, 'goals');
      const querySnapshot = await getDocs(goalsRef);

      const goals = [];
      querySnapshot.forEach((doc) => {
        goals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setLearningGoals(goals);

      // Load user stats and check achievements
      await loadUserStats(userId);
      await checkAndAwardAchievements(userId);
      await updateStreak(userId);
    } catch (error) {
      console.error('Error loading goals:', error);
      setLearningGoals([]);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const saveProfileToFirestore = async (profile) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profile.name,
        country: profile.country,
        grade: profile.grade,
        educationLevel: profile.educationLevel,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const saveGoalToFirestore = async (goal) => {
    if (!user) return goal;

    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', goal.id.toString());
      await setDoc(goalRef, {
        title: goal.title,
        progress: goal.progress,
        roadmap: goal.roadmap,
        nextUp: goal.nextUp,
        culturalContext: goal.culturalContext,
        syllabus: goal.syllabus,
        createdAt: goal.createdAt || new Date(),
        updatedAt: new Date()
      });
      return goal;
    } catch (error) {
      console.error('Error saving goal:', error);
      return goal;
    }
  };

  const deleteGoalFromFirestore = async (goalId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', goalId.toString()));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Community & Study Groups Functions
  const createStudyGroup = async () => {
    if (!user || !newGroupName.trim() || !newGroupSubject || !newGroupLevel || !isFirebaseConfigured) return;

    try {
      const groupId = Date.now().toString();
      const groupRef = doc(db, 'studyGroups', groupId);

      await setDoc(groupRef, {
        id: groupId,
        name: newGroupName,
        description: newGroupDescription,
        owner: user.uid,
        ownerName: userProfile.name,
        members: [user.uid],
        memberCount: 1,
        createdAt: new Date(),
        topic: newGroupName,
        level: newGroupLevel,
        subject: newGroupSubject,
        posts: [],
        documents: []
      });

      // Add to user's groups
      await setDoc(doc(db, 'users', user.uid, 'studyGroups', groupId), {
        groupId,
        name: newGroupName,
        joinedAt: new Date()
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupSubject('');
      setNewGroupLevel('');
      setShowCreateGroup(false);
      setFilterSubject('All');
      setFilterLevel('All');
      await loadStudyGroups(user.uid);
    } catch (error) {
      console.error('Error creating study group:', error);
      alert('Failed to create community');
    }
  };

  const loadStudyGroups = async (userId) => {
    try {
      // Load all communities from the studyGroups collection
      const groupsRef = collection(db, 'studyGroups');
      const querySnapshot = await getDocs(groupsRef);

      const groups = [];
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setStudyGroups(groups);
    } catch (error) {
      console.error('Error loading study groups:', error);
    }
  };

  const joinStudyGroup = async (groupId) => {
    if (!user || !isFirebaseConfigured) return;

    try {
      // Get the group data first
      const groupRef = doc(db, 'studyGroups', groupId);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        // Check if user is already a member
        const isAlreadyMember = (groupData.members || []).includes(user.uid);

        if (!isAlreadyMember) {
          // Add user to group members
          const updatedMembers = [...(groupData.members || []), user.uid];
          await updateDoc(groupRef, {
            members: updatedMembers,
            memberCount: updatedMembers.length
          });

          // Also add to user's groups
          await setDoc(doc(db, 'users', user.uid, 'studyGroups', groupId), {
            groupId,
            name: groupData.name,
            joinedAt: new Date()
          });

          // Award points for joining community
          await awardPoints('JOIN_COMMUNITY', user.uid);

          // Reload communities to show updated join status
          await loadStudyGroups(user.uid);
        }
      }
    } catch (error) {
      console.error('Error joining study group:', error);
      alert('Failed to join community');
    }
  };

  // Study Sessions Functions
  const createStudySession = async () => {
    if (!sessionTitle.trim()) {
      alert('Please enter a session title');
      return;
    }
    if (!sessionCommunity) {
      alert('Please select a community');
      return;
    }
    if (!user) {
      alert('Please log in first');
      return;
    }

    try {
      const sessionId = 'session_' + Date.now();

      const sessionData = {
        id: sessionId,
        title: sessionTitle,
        description: sessionDescription,
        community: sessionCommunity,
        owner: {
          uid: user.uid,
          name: userProfile.name
        },
        participants: [user.uid],
        participantCount: 1,
        maxParticipants: parseInt(maxParticipants),
        meetingLink: sessionMeetingLink,
        createdAt: new Date(),
        active: true,
        messages: []
      };

      await setDoc(doc(db, 'studySessions', sessionId), sessionData);

      setStudySessions(prev => [...prev, sessionData]);
      setShowCreateSessionModal(false);
      setSessionTitle('');
      setSessionDescription('');
      setSessionCommunity('');
      setSessionMeetingLink('');
      setMaxParticipants('5');
      setCurrentSession(sessionData);
      setSessionMessages([]);

      // Award points for creating a session
      await awardPoints('COMMUNITY_POST', user.uid);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    }
  };

  const loadStudySessions = async () => {
    try {
      const sessionsRef = collection(db, 'studySessions');
      const q = query(sessionsRef, where('active', '==', true));
      const querySnapshot = await getDocs(q);

      const sessions = [];
      querySnapshot.forEach((doc) => {
        let sessionData = {
          id: doc.id,
          ...doc.data()
        };

        sessions.push(sessionData);
      });

      setStudySessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const joinStudySession = async (sessionId) => {
    if (!user || !isFirebaseConfigured) return;

    try {
      const sessionRef = doc(db, 'studySessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();

        if (sessionData.participantCount >= sessionData.maxParticipants) {
          alert('Session is full');
          return;
        }

        const isAlreadyMember = sessionData.participants.includes(user.uid);

        if (!isAlreadyMember) {
          const updatedParticipants = [...sessionData.participants, user.uid];
          await updateDoc(sessionRef, {
            participants: updatedParticipants,
            participantCount: updatedParticipants.length
          });

          const updatedSession = { ...sessionData, participants: updatedParticipants, participantCount: updatedParticipants.length };
          setCurrentSession(updatedSession);
          setSessionMessages([]);
        } else {
          setCurrentSession(sessionData);
          setSessionMessages([]);
        }
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session');
    }
  };

  const leaveStudySession = async (sessionId) => {
    if (!user || !isFirebaseConfigured) return;

    try {
      const sessionRef = doc(db, 'studySessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        const updatedParticipants = sessionData.participants.filter(id => id !== user.uid);

        await updateDoc(sessionRef, {
          participants: updatedParticipants,
          participantCount: updatedParticipants.length
        });

        setCurrentSession(null);
        setSessionMessages([]);
        await loadStudySessions();
      }
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const deleteStudySession = async (sessionId) => {
    if (!user || !isFirebaseConfigured) return;

    const session = studySessions.find(s => s.id === sessionId);
    if (session && session.owner.uid !== user.uid) {
      alert('Only the session owner can delete it');
      return;
    }

    try {
      const sessionRef = doc(db, 'studySessions', sessionId);
      await updateDoc(sessionRef, { active: false });

      setStudySessions(prev => prev.filter(s => s.id !== sessionId));
      setCurrentSession(null);
      setSessionMessages([]);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const sendSessionMessage = async (sessionId) => {
    if (!sessionChatInput.trim() || !user || !isFirebaseConfigured) return;

    try {
      const messageId = 'msg_' + Date.now();
      const messageData = {
        id: messageId,
        userId: user.uid,
        userName: userProfile.name,
        content: sessionChatInput,
        timestamp: new Date(),
        avatar: '👤'
      };

      const sessionRef = doc(db, 'studySessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data();
        const updatedMessages = [...(sessionData.messages || []), messageData];

        await updateDoc(sessionRef, {
          messages: updatedMessages
        });

        setSessionMessages(updatedMessages);
        setSessionChatInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateSessionMeetingLink = async (sessionId) => {
    if (!editingMeetingLink.trim()) {
      alert('Please enter a meeting link');
      return;
    }
    if (!user || !isFirebaseConfigured) return;

    try {
      const sessionRef = doc(db, 'studySessions', sessionId);
      await updateDoc(sessionRef, {
        meetingLink: editingMeetingLink
      });

      // Update current session state
      setCurrentSession(prev => ({
        ...prev,
        meetingLink: editingMeetingLink
      }));

      setEditingMeetingLink('');
      setShowEditMeetingLinkModal(false);
      alert('Meeting link updated successfully!');
    } catch (error) {
      console.error('Error updating meeting link:', error);
      alert('Failed to update meeting link');
    }
  };

  const uploadDocument = async () => {
    // Validate inputs
    if (!documentFile) {
      alert('Please select a file');
      return;
    }
    if (!documentName.trim()) {
      alert('Please enter a document title');
      return;
    }
    if (!selectedCommunity) {
      alert('No community selected');
      return;
    }
    if (!isFirebaseConfigured) {
      alert('Firebase is not configured. Please check your configuration.');
      return;
    }
    if (!user) {
      alert('Please log in first');
      return;
    }

    // File size validation: 900KB max for Firestore
    const MAX_FILE_SIZE = 900 * 1024; // 900KB
    if (documentFile.size > MAX_FILE_SIZE) {
      alert(`File size must be less than 900KB (Firestore limit). Your file is ${(documentFile.size / 1024).toFixed(2)}KB. Please use a smaller file.`);
      return;
    }

    // File type validation
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(documentFile.type)) {
      alert('File type not supported. Please upload: PDF, Word, Excel, PowerPoint, Images, or TXT');
      return;
    }

    setIsUploadingDocument(true);
    setUploadProgress(0);

    try {
      console.log('=== Starting document upload to Firestore ===');
      console.log('User authenticated:', !!user);
      console.log('User UID:', user.uid);
      console.log('File:', documentFile.name);
      console.log('File size:', (documentFile.size / 1024).toFixed(2), 'KB');

      // Step 1: Read file as base64
      console.log('Reading file...');
      setUploadProgress(10);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          setUploadProgress(30);

          // Extract base64 data (remove "data:...;base64," prefix)
          const base64Data = e.target.result.split(',')[1];

          console.log('File encoded to base64, length:', base64Data.length);
          setUploadProgress(50);

          // Step 2: Create document metadata with base64 data
          const fileId = Date.now().toString();
          const newDocument = {
            id: fileId,
            name: documentName,
            category: documentCategory,
            fileName: documentFile.name,
            fileSize: (documentFile.size / 1024).toFixed(2) + ' KB',
            uploadedBy: userProfile.name,
            uploadedById: user.uid,
            uploadedAt: new Date().toISOString(),
            type: documentFile.type,
            fileData: base64Data // Store actual file content
          };

          // Step 3: Save to Firestore
          console.log('Saving to Firestore...');
          const communityRef = doc(db, 'studyGroups', selectedCommunity.id);
          const communitySnap = await getDoc(communityRef);

          if (communitySnap.exists()) {
            const currentDocs = communitySnap.data().documents || [];
            const updatedDocs = [...currentDocs, newDocument];

            // Update Firestore
            await updateDoc(communityRef, {
              documents: updatedDocs
            });
            setUploadProgress(85);
            console.log('Metadata saved to Firestore successfully');

            // Update local state
            setCommunityDocuments(updatedDocs);

            // Update selected community with new documents
            setSelectedCommunity(prev => ({
              ...prev,
              documents: updatedDocs
            }));

            // Award points for uploading document
            await awardPoints('DOCUMENT_UPLOAD', user.uid);
            setUploadProgress(100);

            console.log('=== Document upload COMPLETE ===');

            // Reset form and close modal
            setDocumentFile(null);
            setDocumentName('');
            setShowDocumentUpload(false);
            setIsUploadingDocument(false);
            setUploadProgress(0);
            alert('✓ Document uploaded successfully!');
          } else {
            throw new Error('Community not found in database');
          }
        } catch (error) {
          console.error('Error in upload callback:', error);
          setIsUploadingDocument(false);
          setUploadProgress(0);
          alert('Failed to save document: ' + error.message);
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        setIsUploadingDocument(false);
        setUploadProgress(0);
        alert('Failed to read file. Please try again.');
      };

      // Start reading the file
      reader.readAsDataURL(documentFile);

    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error message:', error.message);
      console.error('Full error:', error);

      setIsUploadingDocument(false);
      setUploadProgress(0);
      alert('Failed to upload document: ' + error.message);
    }
  };

  const deleteDocument = async (docId) => {
    if (!selectedCommunity || !isFirebaseConfigured) return;

    try {
      // Remove from Firestore
      const communityRef = doc(db, 'studyGroups', selectedCommunity.id);
      const updatedDocs = communityDocuments.filter(doc => doc.id !== docId);

      await updateDoc(communityRef, {
        documents: updatedDocs
      });

      setCommunityDocuments(updatedDocs);

      // Update selected community with new documents
      setSelectedCommunity(prev => ({
        ...prev,
        documents: updatedDocs
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const downloadDocument = (doc) => {
    if (!doc.fileData) {
      alert('File data not found. Please try downloading again.');
      return;
    }

    try {
      // Decode base64 to binary
      const byteCharacters = atob(doc.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.type });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document: ' + error.message);
    }
  };

  const refreshCommunityDocuments = async () => {
    if (!selectedCommunity || !isFirebaseConfigured) return;

    try {
      const communityRef = doc(db, 'studyGroups', selectedCommunity.id);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        const docs = communitySnap.data().documents || [];
        setCommunityDocuments(docs);
      }
    } catch (error) {
      console.error('Error refreshing documents:', error);
    }
  };

  // Load posts from Firestore for the selected community
  const loadCommunityPosts = async (communityId) => {
    if (!communityId || !isFirebaseConfigured) return;

    try {
      const communityRef = doc(db, 'studyGroups', communityId);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        const posts = communitySnap.data().posts || [];
        // Sort posts by creation date in descending order (newest first)
        const sortedPosts = posts.sort((a, b) => {
          const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt);
          const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt);
          return dateB - dateA;
        });
        setCommunityPosts(sortedPosts);
      } else {
        setCommunityPosts([]);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
      setCommunityPosts([]);
    }
  };

  // Save a new post to Firestore
  const savePostToFirestore = async (postContent) => {
    if (!selectedCommunity || !user || !isFirebaseConfigured) return null;

    try {
      const newPost = {
        id: Date.now().toString(),
        author: userProfile.name,
        authorId: user.uid,
        content: postContent,
        createdAt: new Date().toISOString(),
      };

      // Get current posts from Firestore
      const communityRef = doc(db, 'studyGroups', selectedCommunity.id);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        const currentPosts = communitySnap.data().posts || [];
        const updatedPosts = [newPost, ...currentPosts];

        // Update Firestore
        await updateDoc(communityRef, {
          posts: updatedPosts
        });

        // Update local state with new posts
        setCommunityPosts(updatedPosts);
        return newPost;
      }
    } catch (error) {
      console.error('Error saving post to Firestore:', error);
      alert('Failed to post. Please try again.');
      return null;
    }
  };

  // Delete a post from Firestore (only author can delete)
  const deletePostFromFirestore = async (postId, authorId) => {
    if (!selectedCommunity || !user || !isFirebaseConfigured) return;

    // Check if the current user is the author
    if (user.uid !== authorId) {
      alert('You can only delete your own posts');
      return;
    }

    try {
      const communityRef = doc(db, 'studyGroups', selectedCommunity.id);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        // Filter out the deleted post
        const updatedPosts = (communitySnap.data().posts || []).filter(post => post.id !== postId);

        // Update Firestore
        await updateDoc(communityRef, {
          posts: updatedPosts
        });

        // Update local state
        setCommunityPosts(updatedPosts);
      }
    } catch (error) {
      console.error('Error deleting post from Firestore:', error);
      alert('Failed to delete post');
    }
  };

  const loadLeaderboard = async (page = 1) => {
    try {
      setLeaderboardLoading(true);
      const usersRef = collection(db, 'users');

      // Get total count of users first
      const countSnapshot = await getDocs(usersRef);
      const totalUsers = countSnapshot.docs.length;
      setLeaderboardTotal(totalUsers);

      // Collect all users with their stats efficiently
      const leaderboardUsers = [];

      for (const userDoc of countSnapshot.docs) {
        try {
          const statsRef = doc(db, 'users', userDoc.id, 'stats', 'overview');
          const statsSnap = await getDoc(statsRef);

          // Include user with stats if available, otherwise use default stats
          const stats = statsSnap.exists() ? statsSnap.data() : {};
          leaderboardUsers.push({
            userId: userDoc.id,
            name: userDoc.data().name || 'Anonymous',
            points: stats.points || 0,
            level: stats.level || 1,
            streak: stats.currentStreak || 0,
            goalsCompleted: stats.goalsCompleted || 0,
            badgesCount: (stats.badgesEarned || []).length
          });
        } catch (e) {
          // Include user with default stats even if fetch fails
          const userData = userDoc.data();
          leaderboardUsers.push({
            userId: userDoc.id,
            name: userData.name || 'Anonymous',
            points: 0,
            level: 1,
            streak: 0,
            goalsCompleted: 0,
            badgesCount: 0
          });
        }
      }

      // Sort by points (descending)
      leaderboardUsers.sort((a, b) => b.points - a.points);

      // Pagination
      const startIdx = (page - 1) * leaderboardItemsPerPage;
      const endIdx = startIdx + leaderboardItemsPerPage;
      const paginatedUsers = leaderboardUsers.slice(startIdx, endIdx);

      setLeaderboardData(paginatedUsers);
      setLeaderboardPage(page);
      setLeaderboardLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLeaderboardLoading(false);
    }
  };

  // Fallback to local storage if Firebase is not configured
  const loadProfileFromStorage = async () => {
    try {
      const result = await window.storage?.get('user_profile');
      if (result && result.value) {
        setUserProfile(JSON.parse(result.value));
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      setShowProfileSetup(true);
    }
  };

  const saveProfileToStorage = async (profile) => {
    try {
      await window.storage?.set('user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const loadGoalsFromStorage = async () => {
    try {
      const result = await window.storage?.get('learning_goals');
      if (result && result.value) {
        setLearningGoals(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No saved goals found');
    }
  };

  const saveGoalsToStorage = async (goals) => {
    try {
      await window.storage?.set('learning_goals', JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  };

  const createNewGoal = async () => {
    if (!newGoalTitle.trim()) return;

    setIsGeneratingRoadmap(true);
    setShowGoalModal(false);

    const goalId = Date.now();
    const newGoal = {
      id: goalId,
      title: newGoalTitle,
      progress: 0,
      roadmap: [],
      nextUp: 'Generating roadmap...',
      culturalContext: userProfile.country,
      syllabus: 'Generating...',
      createdAt: new Date()
    };

    const updatedGoals = [...learningGoals, newGoal];
    setLearningGoals(updatedGoals);
    setNewGoalTitle('');

    try {
      const formattedRoadmap = await generateRoadmap(newGoalTitle, userProfile.country);

      const finalGoal = {
        ...newGoal,
        roadmap: formattedRoadmap,
        nextUp: formattedRoadmap[0]?.title || 'Start learning',
        syllabus: `Personalized for ${userProfile.country}`
      };

      const finalGoals = updatedGoals.map(g => g.id === newGoal.id ? finalGoal : g);
      setLearningGoals(finalGoals);

      // Save to Firebase or local storage
      if (user && isFirebaseConfigured) {
        await saveGoalToFirestore(finalGoal);
        await awardPoints('CREATE_GOAL', user.uid);
      } else {
        await saveGoalsToStorage(finalGoals);
      }

      setIsGeneratingRoadmap(false);

    } catch (error) {
      console.error('Error generating roadmap:', error);
      const fallbackRoadmap = [
        { id: 1, title: 'Getting Started', description: 'Begin your learning journey with foundational concepts', completed: false, resources: ['Online tutorials', 'Documentation', 'Video guides'] },
        { id: 2, title: 'Core Concepts', description: 'Master fundamental ideas and principles', completed: false, resources: ['Practice exercises', 'Interactive lessons', 'Study materials'] },
        { id: 3, title: 'Practical Application', description: 'Apply what you have learned to real scenarios', completed: false, resources: ['Project ideas', 'Real examples', 'Case studies'] },
        { id: 4, title: 'Advanced Topics', description: 'Deepen your knowledge with complex subjects', completed: false, resources: ['Expert resources', 'Advanced tutorials', 'Specialized content'] },
        { id: 5, title: 'Mastery & Assessment', description: 'Test and refine your skills', completed: false, resources: ['Practice tests', 'Review materials', 'Assessment tools'] }
      ];

      const fallbackGoal = {
        ...newGoal,
        roadmap: fallbackRoadmap,
        nextUp: fallbackRoadmap[0].title,
        syllabus: `Personalized for ${userProfile.country}`
      };

      const finalGoals = updatedGoals.map(g => g.id === newGoal.id ? fallbackGoal : g);
      setLearningGoals(finalGoals);

      if (user && isFirebaseConfigured) {
        await saveGoalToFirestore(fallbackGoal);
        await awardPoints('CREATE_GOAL', user.uid);
      } else {
        await saveGoalsToStorage(finalGoals);
      }

      setIsGeneratingRoadmap(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    console.log('🚀 sendMessage called - input:', inputMessage);
    const userMsg = { role: 'user', content: inputMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      console.log('⏳ Waiting for AI response...');
      const aiResponse = await getTutorResponse(
        userMsg.content,
        chatMessages,
        userProfile,
        currentGoal?.title,
        tutorSpecialty
      );

      console.log('✅ Got AI response:', aiResponse);
      const aiMsg = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsSendingMessage(false);

      // Award points for messaging
      if (user && isFirebaseConfigured) {
        await awardPoints('TUTOR_MESSAGE', user.uid);
      }

    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      console.error('Error message:', error.message);
      const errorMsg = {
        role: 'assistant',
        content: `Error: ${error.message || "I'm having trouble connecting right now. Please check your internet connection and try again."}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
      setIsSendingMessage(false);
    }
  };

  const toggleStepCompletion = async (goalId, stepId) => {
    const updatedGoals = learningGoals.map(goal => {
      if (goal.id === goalId) {
        const updatedRoadmap = goal.roadmap.map(step =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        );
        const completedSteps = updatedRoadmap.filter(s => s.completed).length;
        const progress = Math.round((completedSteps / updatedRoadmap.length) * 100);
        const nextIncomplete = updatedRoadmap.find(s => !s.completed);

        return {
          ...goal,
          roadmap: updatedRoadmap,
          progress,
          nextUp: nextIncomplete ? nextIncomplete.title : 'All steps completed! 🎉'
        };
      }
      return goal;
    });

    setLearningGoals(updatedGoals);

    // Save to Firebase or local storage
    if (user && isFirebaseConfigured) {
      const updatedGoal = updatedGoals.find(g => g.id === goalId);
      if (updatedGoal) {
        await saveGoalToFirestore(updatedGoal);
        await awardPoints('COMPLETE_STEP', user.uid);

        // Check if goal is complete
        if (updatedGoal.progress === 100) {
          await awardPoints('COMPLETE_GOAL', user.uid);
        }
      }
    } else {
      await saveGoalsToStorage(updatedGoals);
    }

    // Update streak and check achievements
    if (user && isFirebaseConfigured) {
      await updateStreak(user.uid);
      await checkAndAwardAchievements(user.uid);
    }

    if (currentGoal) {
      setCurrentGoal(updatedGoals.find(g => g.id === currentGoal.id));
    }
  };

  const deleteGoal = async (goalId) => {
    const updatedGoals = learningGoals.filter(goal => goal.id !== goalId);
    setLearningGoals(updatedGoals);

    // Delete from Firebase or local storage
    if (user && isFirebaseConfigured) {
      await deleteGoalFromFirestore(goalId);
    } else {
      await saveGoalsToStorage(updatedGoals);
    }

    if (currentGoal && currentGoal.id === goalId) {
      setCurrentGoal(null);
      setCurrentView('home');
    }
  };

  const renderStartPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-16 h-16 text-white" />
            <h1 className="text-6xl font-bold text-white">LearnPath</h1>
          </div>
          <p className="text-2xl text-white/90 font-light">AI-Powered Study Companion for ASEAN</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Why LearnPath?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Learning</h3>
              <p className="text-white/80 text-sm">Get personalized tutoring adapted to your pace and style</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ASEAN-Focused</h3>
              <p className="text-white/80 text-sm">Content aligned with local syllabuses and cultural context</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">100% Free Resources</h3>
              <p className="text-white/80 text-sm">Curated free materials - no tutor fees required</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Get</h2>
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Personalized Learning Roadmaps</p>
                <p className="text-sm text-gray-600">AI generates custom step-by-step paths for any subject</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">24/7 AI Tutor</p>
                <p className="text-sm text-gray-600">Ask questions anytime, get explanations with local examples</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Progress Tracking</p>
                <p className="text-sm text-gray-600">Monitor your journey and celebrate achievements</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-900">Community Learning</p>
                <p className="text-sm text-gray-600">Connect with fellow ASEAN students</p>
              </div>
            </div>
          </div>

          {isFirebaseConfigured ? (
            <button
              onClick={() => {
                setShowAuthModal(true);
                setAuthMode('signup');
                setAuthError('');
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition flex items-center justify-center gap-2"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setHasStarted(true);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition flex items-center justify-center gap-2"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-center text-white/70 mt-6 text-sm">
          Powered by Gemini AI • Built for ASEAN Students • Always Free
        </p>
      </div>
    </div>
  );

  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {authMode === 'login'
              ? 'Welcome back to LearnPath'
              : 'Join LearnPath and start learning'}
          </p>
        </div>

        {authError && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {authError}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {authMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={authMode === 'login' ? handleLogin : handleSignUp}
          disabled={isAuthProcessing}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAuthProcessing && <Loader className="w-4 h-4 animate-spin" />}
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isAuthProcessing}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-gray-600 mt-4 text-sm">
          {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setAuthError('');
              setAuthEmail('');
              setAuthPassword('');
              setAuthName('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

      </div>
    </div>
  );

  const renderProfileSetup = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Set Up Your Profile</h2>
          <p className="text-gray-600 mt-2">Help us personalize your learning experience</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select
              value={userProfile.country}
              onChange={(e) => setUserProfile({ ...userProfile, country: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="Malaysia">Malaysia</option>
              <option value="Singapore">Singapore</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Thailand">Thailand</option>
              <option value="Philippines">Philippines</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Brunei">Brunei</option>
              <option value="Cambodia">Cambodia</option>
              <option value="Laos">Laos</option>
              <option value="Myanmar">Myanmar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
            <select
              value={userProfile.educationLevel}
              onChange={(e) => {
                const level = e.target.value;
                setUserProfile({
                  ...userProfile,
                  educationLevel: level,
                  grade: level === 'Primary School' ? 'Year 6' :
                    level === 'Secondary School' ? 'Form 5' :
                      level === 'Pre-University' ? 'STPM/A-Levels' :
                        level === 'University' ? 'Undergraduate' :
                          'Self-Learning'
                });
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="Primary School">Primary School</option>
              <option value="Secondary School">Secondary School (SPM/O-Levels)</option>
              <option value="Pre-University">Pre-University (STPM/A-Levels)</option>
              <option value="University">University/College</option>
              <option value="Self-Learning">Self-Learning/Adult Education</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specific Grade/Level</label>
            <input
              type="text"
              value={userProfile.grade}
              onChange={(e) => setUserProfile({ ...userProfile, grade: e.target.value })}
              placeholder="e.g., Form 5, Year 12, Undergraduate"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={async () => {
            if (user && isFirebaseConfigured) {
              await saveProfileToFirestore(userProfile);
            } else {
              await saveProfileToStorage(userProfile);
            }
            setShowProfileSetup(false);
          }}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Save Profile
        </button>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs text-blue-100 mb-1">Active Goals</p>
            <h3 className="text-3xl font-bold">{learningGoals.length}</h3>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs text-green-100 mb-1">Avg Progress</p>
            <h3 className="text-3xl font-bold">
              {learningGoals.length > 0 ? Math.round(learningGoals.reduce((acc, g) => acc + g.progress, 0) / learningGoals.length) : 0}%
            </h3>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs text-purple-100 mb-1">AI Conversations</p>
            <h3 className="text-3xl font-bold">{chatMessages.length}</h3>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs text-orange-100 mb-1">Points</p>
            <h3 className="text-3xl font-bold">{userStats.points || 0}</h3>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
            <p className="text-xs text-red-100 mb-1">Level {userStats.level}</p>
            <h3 className="text-lg font-bold">{userStats.experience || 0}/{userStats.maxExperience}</h3>
            <p className="text-xs text-red-100 mt-1">EXP</p>
          </div>
        </div>

        {/* Streak Banner */}
        {userStats.currentStreak > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-5xl">🔥</span>
              <div>
                <h2 className="text-2xl font-bold">{userStats.currentStreak} Day Streak!</h2>
                <p className="text-orange-100">Keep studying to maintain your streak!</p>
              </div>
            </div>
            <div className="text-4xl font-bold">{userStats.currentStreak}</div>
          </div>
        )}

        {isGeneratingRoadmap && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <p className="font-bold text-gray-900">AI is creating your personalized roadmap...</p>
                <p className="text-sm text-gray-600">Analyzing your goal and finding the best free resources</p>
              </div>
            </div>
          </div>
        )}

        {/* Your Learning Goals */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Learning Goals</h2>
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </button>
        </div>

        {learningGoals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Learning Goals Yet</h3>
            <p className="text-gray-600 mb-6">Create your first goal to get started with AI-powered learning!</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningGoals.map(goal => (
              <div
                key={goal.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition relative group"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${goal.title}"? This action cannot be undone.`)) {
                      deleteGoal(goal.id);
                    }
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg"
                  title="Delete goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div
                  onClick={() => {
                    setCurrentGoal(goal);
                    setCurrentView('roadmap');
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Next:</span> {goal.nextUp}
                      </p>
                      <p className="text-xs text-gray-500">
                        {goal.culturalContext} • {goal.syllabus}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{goal.progress}%</div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {goal.roadmap.filter(s => s.completed).length} of {goal.roadmap.length} steps completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRoadmap = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentView('home')}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Goals
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete "${currentGoal.title}"? This will remove the entire goal and roadmap. This action cannot be undone.`)) {
              deleteGoal(currentGoal.id);
            }
          }}
          className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
          Delete Goal
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{currentGoal.title}</h1>
        <p className="text-blue-100 mb-4">Progress: {currentGoal.progress}% Complete</p>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all"
            style={{ width: `${currentGoal.progress}%` }}
          />
        </div>
        <p className="mt-4 text-sm text-blue-100">
          {currentGoal.syllabus} • Culturally adapted for {currentGoal.culturalContext}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Learning Roadmap</h2>
        {currentGoal.roadmap.map((step, index) => (
          <div
            key={step.id}
            className={`bg-white border-2 rounded-xl p-6 transition ${step.completed
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-blue-500'
              }`}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggleStepCompletion(currentGoal.id, step.id)}
                className="flex-shrink-0 mt-1"
              >
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                    Step {index + 1}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                </div>
                {step.description && (
                  <p className="text-gray-700 mb-3">{step.description}</p>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Free Resources:</p>
                  <ul className="space-y-1">
                    {step.resources.map((resource, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setSelectedResource({
                            title: resource,
                            step: step.title,
                            goal: currentGoal.title,
                            description: `Resource for learning: ${resource}`
                          });
                          setShowResourcePage(true);
                        }}
                        className="text-sm text-blue-600 flex items-center gap-2 cursor-pointer hover:text-blue-800 hover:underline transition"
                      >
                        <BookOpen className="w-4 h-4" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView('tutor');
                    setChatMessages([{
                      role: 'assistant',
                      content: `Hi! I'm your AI tutor. I'm here to help you with "${step.title}" as part of your ${currentGoal.title} journey. What would you like to know? I can explain concepts, answer questions, or create practice problems for you!`,
                      timestamp: new Date()
                    }]);
                  }}
                  className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ask AI Tutor About This
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResourcePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => setShowResourcePage(false)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Roadmap
        </button>

        {selectedResource && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600">
              <span>{selectedResource.goal}</span>
              <span className="mx-2">›</span>
              <span>{selectedResource.step}</span>
            </div>

            {/* Main Content */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedResource.title}</h1>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <p className="text-gray-700 mb-4">{selectedResource.description}</p>
                <p className="text-sm text-gray-600 mb-4">
                  This resource is recommended for the <strong>"{selectedResource.step}"</strong> step in your <strong>"{selectedResource.goal}"</strong> learning path.
                </p>
              </div>
            </div>

            {/* Resource Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Free Resource</h3>
                </div>
                <p className="text-sm text-gray-600">This is a free, publicly available resource with no paywall or subscription required.</p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Learning Resource</h3>
                </div>
                <p className="text-sm text-gray-600">Carefully selected to match your education level and curriculum.</p>
              </div>
            </div>

            {/* How to Use */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">How to Use This Resource</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Click the "Search & Learn" button below to find this resource online</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>Read through the material and take notes about key concepts</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>If you have questions, ask the AI Tutor about this topic</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">4.</span>
                  <span>When you're ready, mark this step as complete in your roadmap</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => {
                  // Search for the resource on Google
                  const searchQuery = encodeURIComponent(selectedResource.title);
                  window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Search & Learn
              </button>

              <button
                onClick={() => {
                  setShowResourcePage(false);
                  setCurrentView('tutor');
                  setChatMessages([{
                    role: 'assistant',
                    content: `I see you're interested in "${selectedResource.title}" from your ${selectedResource.step} learning step. How can I help you understand this topic better? Feel free to ask any questions!`,
                    timestamp: new Date()
                  }]);
                }}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Ask AI Tutor About This
              </button>

              <button
                onClick={() => setShowResourcePage(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Back to Learning Path
              </button>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Pro Tip
              </h4>
              <p className="text-sm text-gray-700">
                After learning from this resource, don't forget to mark the step as complete in your roadmap to earn +25 points!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTutor = () => (
    <div className="flex flex-col h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <button
          onClick={() => setCurrentView(currentGoal ? 'roadmap' : 'home')}
          className="text-white/80 hover:text-white flex items-center gap-2 mb-3"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">AI Tutor</h1>
        <p className="text-blue-100 text-sm mt-1">
          {currentGoal ? `Helping you with ${currentGoal.title}` : 'Ask me anything about your studies'}
        </p>
        <div className="mt-4">
          <label className="text-white text-sm font-medium mr-2">Tutor Specialty:</label>
          <select
            value={tutorSpecialty}
            onChange={(e) => setTutorSpecialty(e.target.value)}
            className="px-3 py-1 rounded text-sm text-gray-900 focus:outline-none"
          >
            <option value="General Tutor">General Tutor</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
            <option value="Languages">Languages</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
        <div className="mt-4 text-blue-100 text-xs">
          Teaching at {userProfile.educationLevel} level • {userProfile.country}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">Start a conversation with your AI tutor!</p>
            <div className="space-y-2">
              <button
                onClick={() => setInputMessage("Can you explain this concept in simple terms?")}
                className="block mx-auto text-sm bg-white border-2 border-gray-200 px-4 py-2 rounded-lg hover:border-blue-500 transition"
              >
                "Can you explain this concept in simple terms?"
              </button>
              <button
                onClick={() => setInputMessage("Give me practice questions")}
                className="block mx-auto text-sm bg-white border-2 border-gray-200 px-4 py-2 rounded-lg hover:border-blue-500 transition"
              >
                "Give me practice questions"
              </button>
              <button
                onClick={() => setInputMessage("Help me understand where I went wrong")}
                className="block mx-auto text-sm bg-white border-2 border-gray-200 px-4 py-2 rounded-lg hover:border-blue-500 transition"
              >
                "Help me understand where I went wrong"
              </button>
            </div>
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-lg rounded-2xl px-4 py-3 ${msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border-2 border-gray-200'
                }`}
            >
              <p className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'font-semibold' : ''}`}>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isSendingMessage && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border-2 border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <p className="text-sm text-gray-600">AI is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t-2 border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && sendMessage()}
            placeholder="Ask your question..."
            disabled={isSendingMessage}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={isSendingMessage || !inputMessage.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSendingMessage ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStudySessions = () => (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">📚 Study Sessions</h1>
            <p className="text-blue-100">Create or join study sessions with your community members in real-time</p>
          </div>
          <button
            onClick={() => setShowCreateSessionModal(true)}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create Session
          </button>
        </div>
      </div>

      {currentSession ? (
        // Active Session View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-xl overflow-hidden flex flex-col h-96">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{currentSession.title}</h2>
                  <p className="text-sm text-indigo-100">{currentSession.description}</p>
                </div>
                <button
                  onClick={() => leaveStudySession(currentSession.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm font-medium"
                >
                  Leave
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {sessionMessages.length > 0 ? (
                <div className="space-y-3">
                  {sessionMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.userId === user?.uid ? 'flex-row-reverse' : ''}`}>
                      <span className="text-2xl">{msg.avatar}</span>
                      <div className={`max-w-xs ${msg.userId === user?.uid ? 'bg-indigo-500 text-white' : 'bg-white border-2 border-gray-200'} rounded-lg p-3`}>
                        <p className="text-xs font-semibold opacity-75 mb-1">{msg.userName}</p>
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.userId === user?.uid ? 'text-indigo-100' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No messages yet. Start the conversation!</p>
              )}
            </div>

            <div className="border-t-2 border-gray-200 p-4 bg-white flex gap-2">
              <input
                type="text"
                value={sessionChatInput}
                onChange={(e) => setSessionChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendSessionMessage(currentSession.id)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => sendSessionMessage(currentSession.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Session Info Section */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Session Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Community</p>
                  <p className="font-semibold text-gray-900">{currentSession.community}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner</p>
                  <p className="font-semibold text-gray-900">{currentSession.owner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-semibold text-gray-900">{currentSession.participantCount}/{currentSession.maxParticipants}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">🎥 Meeting Link</p>
                  {currentSession.meetingLink ? (
                    <div className="space-y-2">
                      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-3 flex items-center justify-between gap-2">
                        <a
                          href={currentSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm underline flex-1 break-all"
                        >
                          {currentSession.meetingLink}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentSession.meetingLink);
                            alert('Link copied to clipboard!');
                          }}
                          className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap hover:bg-indigo-700 transition"
                        >
                          Copy
                        </button>
                      </div>
                      {currentSession.owner.uid === user?.uid && (
                        <button
                          onClick={() => {
                            setEditingMeetingLink(currentSession.meetingLink);
                            setShowEditMeetingLinkModal(true);
                          }}
                          className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 transition"
                        >
                          Edit Link
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3">
                      <p className="text-sm text-gray-600">No meeting link added yet</p>
                      {currentSession.owner.uid === user?.uid && (
                        <button
                          onClick={() => {
                            setEditingMeetingLink('');
                            setShowEditMeetingLinkModal(true);
                          }}
                          className="w-full mt-3 bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          Add Meeting Link
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {currentSession.owner.uid === user?.uid && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this session permanently?')) {
                      deleteStudySession(currentSession.id);
                    }
                  }}
                  className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Delete Session
                </button>
              )}
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Participants</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentSession.participants.map(participantId => {
                  const participantName = currentSession.owner.uid === participantId ? currentSession.owner.name : `User ${participantId.slice(0, 6)}`;
                  return (
                    <div key={participantId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-lg">👤</span>
                      <span className="text-sm font-medium text-gray-900">{participantName}</span>
                      {currentSession.owner.uid === participantId && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Owner</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Sessions List View
        <div className="space-y-6">
          {/* Search and Filter Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">🔍 Search Sessions</label>
                <input
                  type="text"
                  value={searchSessions}
                  onChange={(e) => {
                    setSearchSessions(e.target.value);
                    setSessionPage(1);
                  }}
                  placeholder="Search by title or description..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">🏫 Filter by Community</label>
                <select
                  value={filterSessionCommunity}
                  onChange={(e) => {
                    setFilterSessionCommunity(e.target.value);
                    setSessionPage(1);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  <option value="All">All Communities</option>
                  {studyGroups.map(group => (
                    <option key={group.id} value={group.name}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">↕️ Sort By</label>
                <select
                  value={sortSessions}
                  onChange={(e) => {
                    setSortSessions(e.target.value);
                    setSessionPage(1);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-participants">Most Participants</option>
                  <option value="least-participants">Least Participants</option>
                  <option value="available-spots">Most Available Spots</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sessions Grid */}
          <div className="space-y-6">
            {studySessions && studySessions.length > 0 ? (() => {
              let filteredSessions = studySessions.filter(session => {
                const matchesSearch = !searchSessions ||
                  session.title.toLowerCase().includes(searchSessions.toLowerCase()) ||
                  (session.description && session.description.toLowerCase().includes(searchSessions.toLowerCase()));

                const matchesCommunity = filterSessionCommunity === 'All' || session.community === filterSessionCommunity;

                return matchesSearch && matchesCommunity;
              });

              // Sort sessions
              filteredSessions.sort((a, b) => {
                switch (sortSessions) {
                  case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                  case 'most-participants':
                    return b.participantCount - a.participantCount;
                  case 'least-participants':
                    return a.participantCount - b.participantCount;
                  case 'available-spots':
                    return (b.maxParticipants - b.participantCount) - (a.maxParticipants - a.participantCount);
                  case 'newest':
                  default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
              });

              const SESSIONS_PER_PAGE = 9;
              const totalPages = Math.ceil(filteredSessions.length / SESSIONS_PER_PAGE);
              const startIdx = (sessionPage - 1) * SESSIONS_PER_PAGE;
              const displayedSessions = filteredSessions.slice(startIdx, startIdx + SESSIONS_PER_PAGE);

              return (
                <>
                  <div className="text-sm text-gray-600 text-center">
                    Found <span className="font-bold text-indigo-600">{filteredSessions.length}</span> session{filteredSessions.length !== 1 ? 's' : ''} • Page <span className="font-bold">{sessionPage}</span> of <span className="font-bold">{totalPages || 1}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedSessions.map(session => (
                      <div key={session.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition flex flex-col">
                        <div className="mb-4 flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{session.title}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.description || 'No description'}</p>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2">
                              <span>🏫</span>
                              <span className="text-gray-700">{session.community}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span>👥</span>
                              <span className="text-gray-700">
                                {session.participantCount}/{session.maxParticipants}
                                {session.participantCount >= session.maxParticipants && <span className="ml-2 text-red-600 font-bold">(Full)</span>}
                              </span>
                            </p>
                            <p className="flex items-center gap-2">
                              <span>👤</span>
                              <span className="text-gray-700 font-medium text-xs truncate">{session.owner.name}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => joinStudySession(session.id)}
                          disabled={session.participantCount >= session.maxParticipants}
                          className={`w-full py-2 rounded-lg transition font-medium ${session.participantCount >= session.maxParticipants
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                          {session.participantCount >= session.maxParticipants ? 'Session Full' : 'Join Session'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <button
                        onClick={() => setSessionPage(Math.max(1, sessionPage - 1))}
                        disabled={sessionPage === 1}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                      >
                        ← Previous
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setSessionPage(page)}
                            className={`px-3 py-2 rounded-lg transition ${sessionPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'border-2 border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setSessionPage(Math.min(totalPages, sessionPage + 1))}
                        disabled={sessionPage === totalPages}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              );
            })() : (
              <div className="col-span-full bg-gray-50 border-2 border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No active sessions found</p>
                <button
                  onClick={() => setShowCreateSessionModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Create the First Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">📚 Create Study Session</h2>
              <button
                onClick={() => setShowCreateSessionModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Session Title</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Mathematics Study Group"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description (Optional)</label>
                <textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="What's this session about?"
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Community</label>
                  <select
                    value={sessionCommunity}
                    onChange={(e) => setSessionCommunity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select a community...</option>
                    {studyGroups.map(group => (
                      <option key={group.id} value={group.name}>{group.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Max Participants</label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    {[2, 3, 4, 5, 6, 8, 10].map(num => (
                      <option key={num} value={num}>{num} people</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">🎥 Meeting Link (Optional)</label>
                <input
                  type="url"
                  value={sessionMeetingLink}
                  onChange={(e) => setSessionMeetingLink(e.target.value)}
                  placeholder="e.g., https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-600 mt-2">Add your Google Meet, Zoom, or any video call link. Leave blank to add it later.</p>
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
                <p className="text-sm text-indigo-900">
                  <strong>💡 Tip:</strong> Add your meeting link (Google Meet, Zoom, etc.) so participants can join easily. You can also add it later!
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={createStudySession}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meeting Link Modal */}
      {showEditMeetingLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">🎥 {editingMeetingLink ? 'Edit' : 'Add'} Meeting Link</h2>
              <button
                onClick={() => setShowEditMeetingLinkModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Meeting Link URL</label>
                <input
                  type="url"
                  value={editingMeetingLink}
                  onChange={(e) => setEditingMeetingLink(e.target.value)}
                  placeholder="e.g., https://meet.google.com/abc-defg-hij"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
                <p className="text-xs text-gray-600 mt-2">Enter your Google Meet, Zoom, Microsoft Teams, or any other video call link</p>
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
                <p className="text-sm text-indigo-900">
                  <strong>💡 Examples:</strong><br />
                  • Google Meet: https://meet.google.com/abc-defg-hij<br />
                  • Zoom: https://zoom.us/j/123456789<br />
                  • Microsoft Teams: https://teams.microsoft.com/...
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowEditMeetingLinkModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateSessionMeetingLink(currentSession.id)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  {editingMeetingLink ? 'Update' : 'Add'} Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCommunity = () => {
    if (selectedCommunity) {
      return (
        <div className="p-6 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCommunity(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Back to Communities
          </button>

          {/* Community Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{selectedCommunity.name}</h1>
                <p className="text-blue-100 mb-4">{selectedCommunity.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>👥 {selectedCommunity.members?.length || 1} members</span>
                  <span>📅 Created {new Date(selectedCommunity.createdAt?.toDate?.() || selectedCommunity.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedCommunity.owner === user?.uid ? (
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this community? This cannot be undone.')) {
                        try {
                          await deleteDoc(doc(db, 'studyGroups', selectedCommunity.id));
                          setSelectedCommunity(null);
                          await loadStudyGroups(user.uid);
                        } catch (error) {
                          console.error('Error deleting community:', error);
                          alert('Failed to delete community');
                        }
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Delete Community
                  </button>
                ) : selectedCommunity.members?.includes(user?.uid) ? (
                  <button
                    onClick={async () => {
                      if (confirm('Leave this community?')) {
                        try {
                          const members = (selectedCommunity.members || []).filter(m => m !== user?.uid);
                          await updateDoc(doc(db, 'studyGroups', selectedCommunity.id), {
                            members,
                            memberCount: members.length
                          });
                          setSelectedCommunity(null);
                          await loadStudyGroups(user.uid);
                        } catch (error) {
                          console.error('Error leaving community:', error);
                          alert('Failed to leave community');
                        }
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Leave Community
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b-2 border-gray-200">
            <button
              onClick={() => setShowDocumentsTab(false)}
              className={`px-4 py-3 font-medium transition ${!showDocumentsTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Posts
            </button>
            <button
              onClick={() => setShowDocumentsTab(true)}
              className={`px-4 py-3 font-medium transition ${showDocumentsTab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Documents
            </button>
          </div>

          {/* Posts/Documents Section */}
          {!showDocumentsTab ? (
            <div className="space-y-4">
              {/* New Post Button */}
              <button
                onClick={() => setShowPostModal(true)}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>

              {/* Posts List */}
              <div className="space-y-4">
                {communityPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No posts yet. Be the first to post!</p>
                  </div>
                ) : (
                  communityPosts.map((post) => (
                    <div key={post.id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">{post.author}</p>
                          <p className="text-xs text-gray-600">{new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}</p>
                        </div>
                        {post.authorId === user?.uid && (
                          <button
                            onClick={async () => {
                              await deletePostFromFirestore(post.id, post.authorId);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700">{post.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Document Button */}
              {selectedCommunity.members?.includes(user?.uid) && (
                <button
                  onClick={() => setShowDocumentUpload(true)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              )}

              {/* Documents List */}
              <div className="space-y-3">
                {!communityDocuments || communityDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No documents uploaded yet</p>
                  </div>
                ) : (
                  communityDocuments.map((doc) => {
                    // Format date properly
                    let dateStr = '';
                    try {
                      if (doc.uploadedAt) {
                        const date = typeof doc.uploadedAt === 'string'
                          ? new Date(doc.uploadedAt)
                          : doc.uploadedAt?.toDate?.() || new Date(doc.uploadedAt);
                        dateStr = date.toLocaleDateString();
                      }
                    } catch (e) {
                      dateStr = 'Unknown date';
                    }

                    return (
                      <div key={doc.id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{doc.name}</p>
                                {doc.category && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {doc.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{doc.fileName}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-2">
                                <span>👤 {doc.uploadedBy}</span>
                                <span>📁 {doc.fileSize}</span>
                                <span>📅 {dateStr}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-2 flex-shrink-0">
                            <button
                              onClick={() => downloadDocument(doc)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition"
                            >
                              ⬇️ Download
                            </button>
                            {(doc.uploadedById === user?.uid || selectedCommunity.owner === user?.uid) && (
                              <button
                                onClick={() => deleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Learning</h1>
          <p className="text-gray-600">Connect with other learners and share knowledge</p>
        </div>

        {/* Search Communities */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Search Communities</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={searchCommunity}
              onChange={(e) => setSearchCommunity(e.target.value)}
              placeholder="Search by name, subject, or description..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option>All Subjects</option>
                  <option>Programming</option>
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>Languages</option>
                  <option>Business</option>
                  <option>Arts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option>All Levels</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Create Community Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Community
          </button>
        </div>

        {/* Communities List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Communities</h2>
          {studyGroups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No communities yet</h3>
              <p className="text-gray-600 mb-6">Be the first to create a community for your subject!</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Community
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyGroups
                .filter((group) => {
                  const subjectMatch = filterSubject === 'All' || filterSubject === 'All Subjects' || group.subject === filterSubject;
                  const levelMatch = filterLevel === 'All' || filterLevel === 'All Levels' || group.level === filterLevel;
                  const searchMatch = searchCommunity === '' ||
                    group.name.toLowerCase().includes(searchCommunity.toLowerCase()) ||
                    (group.description || '').toLowerCase().includes(searchCommunity.toLowerCase()) ||
                    (group.subject || '').toLowerCase().includes(searchCommunity.toLowerCase());
                  return subjectMatch && levelMatch && searchMatch;
                })
                .map((group) => (
                  <div
                    key={group.id}
                    onClick={async () => {
                      setSelectedCommunity(group);
                      setCommunityDocuments(group.documents || []);
                      setShowDocumentsTab(false);
                      // Load posts from Firestore for this community
                      await loadCommunityPosts(group.id);
                    }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition cursor-pointer"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        👥 {group.members?.length || 1}
                      </span>
                      <span>{group.level || 'All Levels'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinStudyGroup(group.id);
                      }}
                      className={`w-full px-4 py-2 rounded-lg transition font-medium ${group.members?.includes(user?.uid)
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {group.members?.includes(user?.uid) ? 'Already Joined ✓' : 'Join Community'}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProgressTracker = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-blue-100 text-sm mb-2">Total Points</p>
          <h3 className="text-3xl font-bold">{userStats.points || 0}</h3>
          <p className="text-blue-200 text-xs mt-2">Earn more points for achievements</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-red-100 text-sm mb-2">Current Streak</p>
          <h3 className="text-3xl font-bold flex items-center gap-2">{userStats.currentStreak || 0} <span className="text-2xl">🔥</span></h3>
          <p className="text-red-200 text-xs mt-2">Days in a row</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-green-100 text-sm mb-2">Goals Completed</p>
          <h3 className="text-3xl font-bold">{userStats.goalsCompleted || 0}</h3>
          <p className="text-green-200 text-xs mt-2">Learning achieved</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-purple-100 text-sm mb-2">Badges Earned</p>
          <h3 className="text-3xl font-bold">{(userStats.badgesEarned || []).length}</h3>
          <p className="text-purple-200 text-xs mt-2">Achievements unlocked</p>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Your Achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(userStats.badgesEarned || []).map(badgeId => {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
            if (!badge) return null;
            return (
              <div key={badgeId} className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300 rounded-lg p-4 text-center hover:shadow-lg transition">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{badge.name}</p>
                <p className="text-xs text-gray-600 mt-1">{badge.points} pts</p>
              </div>
            );
          })}
        </div>
        {(userStats.badgesEarned || []).length === 0 && (
          <p className="text-gray-600 text-center py-8">Complete goals and maintain streaks to earn badges! 🎯</p>
        )}
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Learning Statistics</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Steps Completed</p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min((userStats.stepsCompleted || 0) / 2, 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{userStats.stepsCompleted || 0} steps</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Longest Streak</p>
            <p className="text-lg font-bold text-gray-900">{userStats.longestStreak || 0} days 🔥</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGamification = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Your Journey</h1>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Current Streak</h2>
          <span className="text-5xl">🔥</span>
        </div>
        <p className="text-2xl font-bold mb-2">{userStats.currentStreak || 0} Days</p>
        <p className="text-blue-100">Keep it up! Your longest is {userStats.longestStreak || 0} days</p>
        {(userStats.currentStreak || 0) >= 7 && (
          <div className="mt-4 bg-white/20 backdrop-blur rounded-lg p-3 flex items-center gap-2">
            <span>🎉</span>
            <p className="text-sm">Amazing! You've earned the "Week Warrior" badge</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Available Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENT_BADGES.map((badge) => {
              const earned = (userStats.badgesEarned || []).includes(badge.id);
              return (
                <div key={badge.id} className={`p-3 rounded-lg border-2 ${earned ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-2xl flex-shrink-0 ${earned ? '' : 'opacity-30'}`}>{badge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${earned ? 'text-gray-900' : 'text-gray-600'}`}>{badge.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{badge.description}</p>
                      <p className={`font-bold text-xs mt-1 ${earned ? 'text-yellow-600' : 'text-gray-400'}`}>{badge.points} pts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Points & Ranking</h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Your Points</p>
              <p className="text-4xl font-bold text-blue-600">{userStats.points || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Goals Completed</p>
              <p className="text-3xl font-bold text-green-600">{userStats.goalsCompleted || 0}</p>
            </div>
            <button
              onClick={async () => {
                if (user) await loadLeaderboard();
                setCurrentView('leaderboard');
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View Global Leaderboard
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">🏆 Badges Earned</h2>
          <span className="bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded-full text-sm">{(userStats.badgesEarned || []).length}</span>
        </div>
        {(userStats.badgesEarned || []).length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pr-2">
              {(userStats.badgesEarned || []).map(badgeId => {
                const badge = ACHIEVEMENT_BADGES.find(b => b.id === badgeId);
                if (!badge) return null;
                return (
                  <div key={badgeId} className="text-center bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-4 border-2 border-yellow-400 hover:shadow-lg transition">
                    <div className="text-5xl mb-2">{badge.icon}</div>
                    <p className="font-bold text-gray-900 text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-600 mt-1">+{badge.points} pts</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-12">Complete your first goal to start earning badges! 🎯</p>
        )}
      </div>
    </div>
  );

  const renderPolicyModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 border-b-4 border-yellow-400 flex-shrink-0">
          <h2 className="text-4xl font-bold">📋 LearnPath Terms & Conditions</h2>
          <p className="text-blue-100 mt-3 text-lg">Please read and accept to use the platform</p>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-smooth">
          <div className="p-10 space-y-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">Welcome to LearnPath! 🚀</h3>
              <p className="text-base text-blue-800 leading-relaxed">By accepting these terms, you commit to using LearnPath responsibly and ethically. This is your learning companion built for your success!</p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">📖 Point System</h3>
                <ul className="text-base text-gray-700 space-y-3 ml-6">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Create Learning Goal: <span className="font-bold text-green-600">+50 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Complete Learning Step: <span className="font-bold text-green-600">+25 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Complete Full Goal: <span className="font-bold text-green-600">+200 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>AI Tutor Message: <span className="font-bold text-green-600">+5 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Community Post: <span className="font-bold text-green-600">+10 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Document Upload: <span className="font-bold text-green-600">+15 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Join Community: <span className="font-bold text-green-600">+20 pts</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <span>Daily Login: <span className="font-bold text-green-600">+10 pts</span></span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border-l-4 border-indigo-600">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🎖️ Level System</h3>
                <p className="text-base text-gray-700 leading-relaxed">Earn experience points (EXP) from your learning activities. Every 500 EXP = 1 Level up! Unlock new features and badges as you level up.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border-l-4 border-orange-600">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🔥 Daily Streaks</h3>
                <p className="text-base text-gray-700 leading-relaxed">Log in every day to maintain your streak! Each day counts toward special streak achievements. Bonus points awarded per streak day!</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-lg border-l-4 border-amber-600">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🏆 Leaderboard & Competition</h3>
                <p className="text-base text-gray-700 leading-relaxed">Compete fairly with other students globally. Your rank is based on total points earned. Be respectful and help others learn!</p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg border-l-4 border-teal-600">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">📋 Responsible Usage</h3>
                <div className="text-base text-gray-700 space-y-2">
                  <p className="flex items-start gap-3"><span className="text-teal-600 font-bold">•</span> <span>Use genuine learning goals to earn points</span></p>
                  <p className="flex items-start gap-3"><span className="text-teal-600 font-bold">•</span> <span>No spam or artificial point farming</span></p>
                  <p className="flex items-start gap-3"><span className="text-teal-600 font-bold">•</span> <span>Respect community members and moderators</span></p>
                  <p className="flex items-start gap-3"><span className="text-teal-600 font-bold">•</span> <span>Share quality educational content only</span></p>
                  <p className="flex items-start gap-3"><span className="text-teal-600 font-bold">•</span> <span>Report inappropriate behavior</span></p>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-lg">
                <p className="text-sm text-yellow-900 leading-relaxed">
                  <span className="font-bold text-lg">⚠️ Important:</span> Users found violating these terms may face point deduction, suspension, or permanent ban from the platform. We take community safety seriously!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-8 flex-shrink-0">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policyCheckbox}
                onChange={(e) => setPolicyCheckbox(e.target.checked)}
                className="w-5 h-5 accent-blue-600 mt-1"
              />
              <span className="text-sm text-gray-700">
                I agree to the LearnPath Terms & Conditions and understand the point system, competition rules, and platform policies. I commit to using LearnPath responsibly.
              </span>
            </label>

            <button
              onClick={acceptPolicy}
              disabled={!policyCheckbox}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-3">📚 How to Use LearnPath</h1>
        <p className="text-lg text-blue-100">Master the platform and maximize your learning journey</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎯</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">1. Create Learning Goals</h2>
              <p className="text-gray-700 mb-3">Start by creating a learning goal. Type what you want to learn (e.g., "Python Programming", "SPM Physics").</p>
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> Our AI will generate a personalized 5-step roadmap with free resources based on your country's curriculum!
              </div>
              <p className="mt-2 text-sm font-semibold text-green-600">Earn: <strong>+50 points</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">2. Complete Learning Steps</h2>
              <p className="text-gray-700 mb-3">Click on your goal to see the roadmap. Complete each step one by one. Check off completed steps to track progress.</p>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> Use our AI Tutor (Ask AI Tutor About This) to get help with any step!
              </div>
              <p className="mt-2 text-sm font-semibold text-green-600">Earn: <strong>+25 points per step</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">3. Ask Your AI Tutor</h2>
              <p className="text-gray-700 mb-3">Go to "AI Tutor" tab and ask any question about your learning goal. Our AI provides personalized explanations based on your education level and country.</p>
              <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> You can ask for practice questions, explanations, or help with difficult concepts!
              </div>
              <p className="mt-2 text-sm font-semibold text-green-600">Earn: <strong>+5 points per message</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">👥</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">4. Join Communities</h2>
              <p className="text-gray-700 mb-3">Find and join study communities with other students. Share notes, ask questions, and learn together. You can also create your own community!</p>
              <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> Upload documents, create posts, and help other students to build your reputation!
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-semibold text-green-600">Earn:</p>
                <p className="text-gray-600">• +20 points for joining<br />• +10 points per post<br />• +15 points per document upload</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-pink-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📊</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">5. Track Your Progress</h2>
              <p className="text-gray-700 mb-3">View your analytics dashboard to see learning patterns, time spent, and progress across goals. Check "Analytics" tab for detailed insights.</p>
              <div className="bg-pink-50 p-3 rounded border-l-4 border-pink-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> Use analytics to identify weak areas and focus your studying!
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🏆</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">6. Compete & Earn Badges</h2>
              <p className="text-gray-700 mb-3">Earn points from all activities and climb the global leaderboard. Unlock special badges as you hit milestones!</p>
              <div className="bg-red-50 p-3 rounded border-l-4 border-red-600 text-sm text-gray-700">
                💡 <strong>Tip:</strong> Each achievement unlocks bonus points. Aim for 2000+ points to become a LearnPath Legend! 👑
              </div>
              <p className="mt-3 text-sm">
                <strong>Available Badges:</strong><br />
                🎯 Goal Setter • 📚 Step Forward • 🏆 Goal Master • 💬 Chat Warrior<br />
                ⭐ Community Star • 🔥 On Fire! • 📄 Knowledge Sharer • 🦋 Social Butterfly<br />
                ⚡ Speed Learner • 👑 LearnPath Legend
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-300">
          <h3 className="text-xl font-bold text-gray-900 mb-3">⭐ Pro Tips for Success</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ <strong>Daily Login:</strong> Log in every day to maintain your streak and earn bonus points</li>
            <li>✅ <strong>Realistic Goals:</strong> Create achievable learning goals that genuinely interest you</li>
            <li>✅ <strong>Regular Practice:</strong> Complete at least one step per week to stay on track</li>
            <li>✅ <strong>Community Help:</strong> Ask questions in communities when stuck</li>
            <li>✅ <strong>Share Knowledge:</strong> Upload documents and create posts to help others</li>
            <li>✅ <strong>Check Analytics:</strong> Review your progress weekly to stay motivated</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">📊 Your Learning Analytics</h1>
        <p className="text-blue-100">Detailed insights into your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-blue-100 text-sm">Total Points</p>
          <h3 className="text-4xl font-bold mt-2">{userStats.points || 0}</h3>
          <p className="text-blue-200 text-xs mt-2">All-time earnings</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-purple-100 text-sm">Current Level</p>
          <h3 className="text-4xl font-bold mt-2">Level {userStats.level || 1}</h3>
          <div className="mt-3 w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full" style={{ width: `${((userStats.experience || 0) / (userStats.maxExperience || 500)) * 100}%` }}></div>
          </div>
          <p className="text-xs text-purple-200 mt-2">{userStats.experience || 0}/{userStats.maxExperience || 500} EXP</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-orange-100 text-sm">Current Streak</p>
          <h3 className="text-4xl font-bold mt-2">{userStats.currentStreak || 0} 🔥</h3>
          <p className="text-orange-200 text-xs mt-2">Best: {userStats.longestStreak || 0} days</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <p className="text-green-100 text-sm">Goals Completed</p>
          <h3 className="text-4xl font-bold mt-2">{userStats.goalsCompleted || 0}</h3>
          <p className="text-green-200 text-xs mt-2">Achievements unlocked</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Activity Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Learning Steps Completed</span>
                <span className="font-bold text-blue-600">{userStats.stepsCompleted || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((userStats.stepsCompleted || 0) / 10) * 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Messages with AI Tutor</span>
                <span className="font-bold text-purple-600">{userStats.messagesSent || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((userStats.messagesSent || 0) / 10) * 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Community Posts</span>
                <span className="font-bold text-orange-600">{userStats.postsCreated || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((userStats.postsCreated || 0) / 5) * 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Documents Uploaded</span>
                <span className="font-bold text-green-600">{userStats.documentsUploaded || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((userStats.documentsUploaded || 0) / 5) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Recommendations</h3>
          <div className="space-y-3">
            {userStats.stepsCompleted === 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                <p className="text-sm font-semibold text-blue-900">Complete your first step</p>
                <p className="text-xs text-blue-700 mt-1">Start a goal and complete one learning step to earn 25 points!</p>
              </div>
            )}

            {(userStats.currentStreak || 0) < 7 && (
              <div className="bg-orange-50 border-l-4 border-orange-600 p-3 rounded">
                <p className="text-sm font-semibold text-orange-900">Build your streak</p>
                <p className="text-xs text-orange-700 mt-1">Log in daily to reach 7 days and earn the "On Fire!" badge!</p>
              </div>
            )}

            {(userStats.goalsCompleted || 0) < 3 && (
              <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded">
                <p className="text-sm font-semibold text-green-900">Complete more goals</p>
                <p className="text-xs text-green-700 mt-1">Finish 3 goals to unlock the "Goal Master" badge!</p>
              </div>
            )}

            {(userStats.points || 0) < 2000 && (
              <div className="bg-purple-50 border-l-4 border-purple-600 p-3 rounded">
                <p className="text-sm font-semibold text-purple-900">Aim for Legend status</p>
                <p className="text-xs text-purple-700 mt-1">Earn {2000 - (userStats.points || 0)} more points to become a LearnPath Legend!</p>
              </div>
            )}

            {(userStats.messagesSent || 0) < 10 && (
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-3 rounded">
                <p className="text-sm font-semibold text-indigo-900">Use your AI Tutor</p>
                <p className="text-xs text-indigo-700 mt-1">Have {10 - (userStats.messagesSent || 0)} more conversations to earn the "Chat Warrior" badge!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Learning Milestones</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-blue-900">Total Learning Time</p>
                <p className="font-bold text-blue-600">{Math.floor((userStats.totalLearningTime || 0) / 60)} hrs</p>
              </div>
              <p className="text-xs text-blue-700">Keep tracking your dedication!</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-green-900">Steps Completed</p>
                <p className="font-bold text-green-600">{userStats.stepsCompleted || 0}/50</p>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((userStats.stepsCompleted || 0) / 50) * 100)}%` }}></div>
              </div>
              <p className="text-xs text-green-700 mt-2">Progress to 50 steps milestone</p>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-orange-900">Longest Streak</p>
                <p className="font-bold text-orange-600">{userStats.longestStreak || 0} days 🔥</p>
              </div>
              <p className="text-xs text-orange-700">Your personal best consistency record</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Your Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Average Points Per Goal</p>
                <p className="text-xs text-gray-600 mt-1">{userStats.goalsCompleted > 0 ? Math.round((userStats.points || 0) / (userStats.goalsCompleted || 1)) : 0} pts/goal</p>
              </div>
              <span className="text-3xl">📈</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Community Engagement</p>
                <p className="text-xs text-gray-600 mt-1">{((userStats.postsCreated || 0) + (userStats.documentsUploaded || 0))} contributions</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">Badges Earned</p>
                <p className="text-xs text-gray-600 mt-1">{(userStats.badgesEarned || []).length} achievements unlocked</p>
              </div>
              <span className="text-3xl">🏅</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => {
    const totalPages = Math.ceil(leaderboardTotal / leaderboardItemsPerPage);
    const startRank = (leaderboardPage - 1) * leaderboardItemsPerPage + 1;

    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white rounded-xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-2">🏆 Global Leaderboard</h1>
          <p className="text-orange-100">Top performers in the LearnPath community ({leaderboardTotal.toLocaleString()} users)</p>
        </div>

        {leaderboardData.length > 0 ? (
          <>
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-yellow-100 to-orange-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Rank</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-900">Student</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">Points</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">Level</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">Streak</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">Goals</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-900">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, idx) => {
                      const globalRank = startRank + idx;
                      return (
                        <tr key={entry.userId} className={`border-b border-gray-200 hover:bg-blue-50 transition ${globalRank <= 3 ? 'bg-yellow-50' : ''}`}>
                          <td className="px-6 py-4">
                            <span className="font-bold text-lg">
                              {globalRank === 1 && '🥇 #1'}
                              {globalRank === 2 && '🥈 #2'}
                              {globalRank === 3 && '🥉 #3'}
                              {globalRank > 3 && `#${globalRank}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{entry.name}</p>
                              {user?.uid === entry.userId && <p className="text-xs text-blue-600">Your Account</p>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-blue-600 text-lg">{entry.points.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">Level {entry.level}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg">{entry.streak > 0 ? `${entry.streak} 🔥` : '—'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-green-600">{entry.goalsCompleted}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">{entry.badgesCount}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => loadLeaderboard(leaderboardPage - 1)}
                  disabled={leaderboardPage === 1 || leaderboardLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (leaderboardPage <= 3) {
                      pageNum = i + 1;
                    } else if (leaderboardPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = leaderboardPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => loadLeaderboard(pageNum)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${leaderboardPage === pageNum
                          ? 'bg-orange-600 text-white'
                          : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => loadLeaderboard(leaderboardPage + 1)}
                  disabled={leaderboardPage === totalPages || leaderboardLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>

                <span className="text-gray-600 ml-4">
                  Page {leaderboardPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        ) : leaderboardLoading ? (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-gray-600 text-lg">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 text-lg">No leaderboard data available</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-300">
          <h3 className="text-xl font-bold text-gray-900 mb-3">💡 How to Climb the Leaderboard</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Complete learning goals for 200 points each</li>
            <li>✅ Finish learning steps daily for 25 points each</li>
            <li>✅ Participate in AI Tutor conversations for 5 points each</li>
            <li>✅ Contribute to communities with posts and documents</li>
            <li>✅ Maintain daily login streaks for consistent bonus points</li>
            <li>✅ Unlock achievement badges for extra points</li>
          </ul>
        </div>
      </div>
    );
  };



  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading LearnPath...</p>
        </div>
      </div>
    );
  }

  // Show auth modal on start page if user clicked "Start Learning"
  if (!hasStarted) {
    return (
      <>
        {renderStartPage()}
        {showAuthModal && renderAuthModal()}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top Row: Logo + Main Nav */}
          <div className="flex items-center justify-between mb-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LearnPath</span>
            </div>

            {/* Right Side Stats */}
            <div className="flex items-center gap-4">
              {/* Level Box */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl px-4 py-3 shadow-md hover:shadow-lg transition">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Level</p>
                <p className="text-2xl font-bold text-blue-700">{userStats.level}</p>
              </div>

              {/* Points Box */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl px-4 py-3 shadow-md hover:shadow-lg transition">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Points</p>
                <p className="text-2xl font-bold text-green-700">{userStats.points || 0}</p>
              </div>

              {/* Streak Box */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl px-4 py-3 shadow-md hover:shadow-lg transition flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Streak</p>
                  <p className="text-2xl font-bold text-orange-700">{userStats.currentStreak || 0}</p>
                </div>
              </div>

              {/* User & Logout */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l-2 border-gray-200">
                <button
                  onClick={() => setShowProfileSetup(true)}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:shadow-lg transition font-medium text-sm"
                >
                  {userProfile.name.split(' ')[0]}
                </button>
                {user && isFirebaseConfigured && (
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium text-sm"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs */}
          <div className="flex gap-2 pt-4 border-t border-gray-100 overflow-x-auto pb-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'home'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => currentGoal && setCurrentView('roadmap')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'roadmap'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                } ${!currentGoal ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!currentGoal}
            >
              <Target className="w-4 h-4" />
              Roadmap
            </button>
            <button
              onClick={() => setCurrentView('tutor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'tutor'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              AI Tutor
            </button>
            <button
              onClick={() => setCurrentView('community')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'community'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Users className="w-4 h-4" />
              Community
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'analytics'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={async () => {
                await loadLeaderboard();
                setCurrentView('leaderboard');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'leaderboard'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setCurrentView('achievements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'achievements'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Achievements
            </button>
            <button
              onClick={() => {
                loadStudySessions();
                setCurrentView('sessions');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'sessions'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              📚 Sessions
            </button>
            <button
              onClick={() => setCurrentView('instructions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap ${currentView === 'instructions'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              ℹ️ Help
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {currentView === 'home' && renderHome()}
        {currentView === 'roadmap' && currentGoal && !showResourcePage && renderRoadmap()}
        {showResourcePage && renderResourcePage()}
        {currentView === 'tutor' && renderTutor()}
        {currentView === 'community' && renderCommunity()}

        {currentView === 'analytics' && renderAnalytics()}
        {currentView === 'leaderboard' && renderLeaderboard()}
        {currentView === 'achievements' && renderGamification()}
        {currentView === 'sessions' && renderStudySessions()}
        {currentView === 'instructions' && renderInstructions()}
        {currentView === 'progress' && renderProgressTracker()}
      </div>

      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Learning Goal</h2>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="E.g., Learn Python Programming, Master SPM Physics..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && createNewGoal()}
            />
            <p className="text-sm text-gray-600 mb-6">
              Our AI will generate a personalized roadmap with free resources aligned to {userProfile.country}'s curriculum and teaching methods.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createNewGoal}
                disabled={!newGoalTitle.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Community</h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Community Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="E.g., SPM Mathematics Study Group"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this community about?"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  value={newGroupSubject || filterSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a subject</option>
                  <option value="Programming">Programming</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Languages">Languages</option>
                  <option value="Business">Business</option>
                  <option value="Arts">Arts</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education Level *</label>
                <select
                  value={newGroupLevel || filterLevel}
                  onChange={(e) => setNewGroupLevel(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createStudyGroup}
                disabled={!newGroupName.trim() || !newGroupSubject || !newGroupLevel}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Create Community
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What would you like to share with your community?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none h-32 resize-none"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPostModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newPostContent.trim()) return;

                  // Save post to Firestore
                  const savedPost = await savePostToFirestore(newPostContent);

                  if (savedPost) {
                    setNewPostContent('');
                    setShowPostModal(false);

                    // Award points for creating post
                    if (user && isFirebaseConfigured) {
                      await awardPoints('COMMUNITY_POST', user.uid);
                    }
                  }
                }}
                disabled={!newPostContent.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
              <button
                onClick={() => {
                  if (!isUploadingDocument) setShowDocumentUpload(false);
                }}
                disabled={isUploadingDocument}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="E.g., SPM Physics Notes Chapter 1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  disabled={isUploadingDocument}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={documentCategory}
                  onChange={(e) => setDocumentCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  disabled={isUploadingDocument}
                >
                  <option value="Notes">Notes</option>
                  <option value="Assignments">Assignments</option>
                  <option value="Reference">Reference</option>
                  <option value="Past Papers">Past Papers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose File *</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    console.log('File selected:', file);
                    setDocumentFile(file || null);
                  }}
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.jpg,.png,.jpeg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
                  disabled={isUploadingDocument}
                />
                <p className="text-xs text-gray-600 mt-2">Supported: PDF, Word, Excel, PowerPoint, Images, TXT (Max 900KB)</p>
                {documentFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {documentFile.name} ({(documentFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploadingDocument && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {uploadProgress === 0 && 'Initializing...'}
                      {uploadProgress > 0 && uploadProgress < 30 && 'Reading file...'}
                      {uploadProgress >= 30 && uploadProgress < 50 && 'Encoding...'}
                      {uploadProgress >= 50 && uploadProgress < 85 && 'Saving to database...'}
                      {uploadProgress >= 85 && 'Finalizing...'}
                    </p>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Uploading directly to Firestore database (no Firebase Storage needed)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDocumentUpload(false)}
                disabled={isUploadingDocument}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={uploadDocument}
                disabled={!documentName.trim() || !documentFile || isUploadingDocument}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploadingDocument ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPolicyModal && renderPolicyModal()}
      {showProfileSetup && renderProfileSetup()}
      {showAuthModal && renderAuthModal()}
    </div>
  );
};

export default LearnPath;