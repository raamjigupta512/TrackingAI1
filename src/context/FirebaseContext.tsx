import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  writeBatch,
  query,
  getDocs
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from '../../services/firebase';
import { User, Shipment, Rule } from '../../types';
import { MOCK_SHIPMENTS } from '../../constants';

interface FirebaseContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  shipments: Shipment[];
  rules: Rule[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateShipmentInFirestore: (shipment: Shipment) => Promise<void>;
  saveRuleInFirestore: (rule: Rule) => Promise<void>;
  toggleRuleInFirestore: (ruleId: string, isActive: boolean) => Promise<void>;
  deleteRuleInFirestore: (ruleId: string) => Promise<void>;
  batchUpdateShipments: (updatedShipments: Shipment[]) => Promise<void>;
  localLoginFallback: (email: string, role: 'Customer' | 'Agent') => void;
  seedDatabase: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Validate Firestore Connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Sync Auth State & Firestore Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      
      if (fUser) {
        // 1. Sync User Profile doc from Firestore
        const userDocRef = doc(db, 'users', fUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          } else {
            // Profile doesn't exist yet, wait for creation inside signInWithGoogle
            // Or create here as a fallback if needed
            const role = fUser.email === 'manav.imt01@gmail.com' ? 'Agent' : 'Customer';
            const newUserProfile: User = {
              email: fUser.email || '',
              name: fUser.displayName || fUser.email?.split('@')[0] || 'User',
              company: 'Global Trade Corp',
              role
            };
            try {
              await setDoc(userDocRef, newUserProfile);
              setUser(newUserProfile);
            } catch (err) {
              console.error("Error creating profile on snapshot fallback:", err);
            }
          }
        }, (err) => {
          console.error("Error fetching user profile:", err);
        });

        // 2. Sync Shipments list in real-time
        const shipmentsColRef = collection(db, 'shipments');
        const unsubscribeShipments = onSnapshot(shipmentsColRef, (snapshot) => {
          const fetchedShipments: Shipment[] = [];
          snapshot.forEach((docSnap) => {
            fetchedShipments.push(docSnap.data() as Shipment);
          });
          
          if (fetchedShipments.length > 0) {
            setShipments(fetchedShipments);
          } else {
            // If shipments collection is empty, trigger seeding
            const role = fUser.email === 'manav.imt01@gmail.com' ? 'Agent' : 'Customer';
            if (role === 'Agent') {
              seedDatabase();
            } else {
              // Customers fall back to mock shipments locally if empty on backend
              setShipments(MOCK_SHIPMENTS);
            }
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'shipments');
        });

        // 3. Sync Rules list in real-time
        const rulesColRef = collection(db, 'rules');
        const unsubscribeRules = onSnapshot(rulesColRef, (snapshot) => {
          const fetchedRules: Rule[] = [];
          snapshot.forEach((docSnap) => {
            fetchedRules.push(docSnap.data() as Rule);
          });
          setRules(fetchedRules);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'rules');
        });

        return () => {
          unsubscribeUser();
          unsubscribeShipments();
          unsubscribeRules();
        };
      } else {
        // Handle local storage fallback if they logged in with custom corporate email offline
        const savedUser = localStorage.getItem('maersk_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          const savedShipments = localStorage.getItem('maersk_shipments');
          setShipments(savedShipments ? JSON.parse(savedShipments) : MOCK_SHIPMENTS);
          
          const savedRules = localStorage.getItem('maersk_rules');
          setRules(savedRules ? JSON.parse(savedRules) : []);
        } else {
          setUser(null);
          setShipments([]);
          setRules([]);
        }
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Seed default shipments if database is completely empty or requested by user
  const seedDatabase = async () => {
    try {
      console.log('Seeding 100 default shipments...');
      if (auth.currentUser) {
        const batch = writeBatch(db);
        MOCK_SHIPMENTS.forEach((shipment) => {
          const docRef = doc(db, 'shipments', shipment.id);
          batch.set(docRef, shipment);
        });
        await batch.commit();
      } else {
        setShipments(MOCK_SHIPMENTS);
        localStorage.setItem('maersk_shipments', JSON.stringify(MOCK_SHIPMENTS));
      }
      console.log('Seeding completed successfully.');
    } catch (err) {
      console.error('Error seeding data:', err);
      throw err;
    }
  };

  // Google Login Auth Action
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const fUser = result.user;
      
      // Setup or sync their Firestore profile
      const userDocRef = doc(db, 'users', fUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        const role = fUser.email === 'manav.imt01@gmail.com' ? 'Agent' : 'Customer';
        const newUserProfile: User = {
          email: fUser.email || '',
          name: fUser.displayName || fUser.email?.split('@')[0] || 'User',
          company: 'Global Trade Corp',
          role
        };
        await setDoc(userDocRef, newUserProfile);
        setUser(newUserProfile);
      } else {
        setUser(docSnap.data() as User);
      }
    } catch (err) {
      console.error('Google Auth login error:', err);
      throw err;
    }
  };

  // Sign out Auth Action
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('maersk_user');
      localStorage.removeItem('maersk_shipments');
      localStorage.removeItem('maersk_rules');
      setUser(null);
      setShipments([]);
      setRules([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Offline / Corporate Email Fallback Sign In
  const localLoginFallback = (email: string, role: 'Customer' | 'Agent') => {
    const localUser: User = {
      email,
      name: email.split('@')[0],
      company: 'Global Trade Corp',
      role
    };
    setUser(localUser);
    localStorage.setItem('maersk_user', JSON.stringify(localUser));
    
    // Pull from localStorage
    const savedShipments = localStorage.getItem('maersk_shipments');
    setShipments(savedShipments ? JSON.parse(savedShipments) : MOCK_SHIPMENTS);
    
    const savedRules = localStorage.getItem('maersk_rules');
    setRules(savedRules ? JSON.parse(savedRules) : []);
  };

  // --- WRITE OPERATIONAL FUNCTIONS ---

  const updateShipmentInFirestore = async (shipment: Shipment) => {
    const path = `shipments/${shipment.id}`;
    try {
      if (firebaseUser) {
        await setDoc(doc(db, 'shipments', shipment.id), shipment);
      } else {
        // Fallback to local storage if offline
        const updated = shipments.map(s => s.id === shipment.id ? shipment : s);
        setShipments(updated);
        localStorage.setItem('maersk_shipments', JSON.stringify(updated));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const saveRuleInFirestore = async (rule: Rule) => {
    const path = `rules/${rule.id}`;
    try {
      if (firebaseUser) {
        await setDoc(doc(db, 'rules', rule.id), rule);
      } else {
        // Local state
        let updated: Rule[];
        if (rules.some(r => r.id === rule.id)) {
          updated = rules.map(r => r.id === rule.id ? rule : r);
        } else {
          updated = [...rules, rule];
        }
        setRules(updated);
        localStorage.setItem('maersk_rules', JSON.stringify(updated));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const toggleRuleInFirestore = async (ruleId: string, isActive: boolean) => {
    const path = `rules/${ruleId}`;
    try {
      if (firebaseUser) {
        const ruleDocRef = doc(db, 'rules', ruleId);
        const docSnap = await getDoc(ruleDocRef);
        if (docSnap.exists()) {
          const ruleData = docSnap.data() as Rule;
          await setDoc(ruleDocRef, { ...ruleData, isActive });
        }
      } else {
        const updated = rules.map(r => r.id === ruleId ? { ...r, isActive } : r);
        setRules(updated);
        localStorage.setItem('maersk_rules', JSON.stringify(updated));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteRuleInFirestore = async (ruleId: string) => {
    const path = `rules/${ruleId}`;
    try {
      if (firebaseUser) {
        // Rules delete is allowed for Agents
        const batch = writeBatch(db);
        batch.delete(doc(db, 'rules', ruleId));
        await batch.commit();
      } else {
        const updated = rules.filter(r => r.id !== ruleId);
        setRules(updated);
        localStorage.setItem('maersk_rules', JSON.stringify(updated));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const batchUpdateShipments = async (updatedShipments: Shipment[]) => {
    try {
      if (firebaseUser) {
        const batch = writeBatch(db);
        updatedShipments.forEach((s) => {
          const docRef = doc(db, 'shipments', s.id);
          batch.set(docRef, s);
        });
        await batch.commit();
      } else {
        setShipments(updatedShipments);
        localStorage.setItem('maersk_shipments', JSON.stringify(updatedShipments));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shipments-batch');
    }
  };

  return (
    <FirebaseContext.Provider value={{
      firebaseUser,
      user,
      shipments,
      rules,
      loading,
      signInWithGoogle,
      logout,
      updateShipmentInFirestore,
      saveRuleInFirestore,
      toggleRuleInFirestore,
      deleteRuleInFirestore,
      batchUpdateShipments,
      localLoginFallback,
      seedDatabase
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};
