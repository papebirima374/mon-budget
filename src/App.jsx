// src/App.jsx — Mon Budget avec Firebase (sauvegarde permanente)
import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

// Tes constantes fixes
const SALAIRE = 250000;
const TONTINE1 = 100000;
const TONTINE2 = 20000;

const CATEGORIES_DEP = ["Alimentation","Transport","Santé","Famille","Dette", "Aide/Don","Loisirs","Cadeau","Chambre","Mariage","Autre"];
const CATEGORIES_ENT = ["Prime / Bonus","Vente","Petit boulot", "Remboursement reçu","Tontine reçue","Autre revenu"];

export default function App() {
  // États chargés depuis Firebase
  const [depenses, setDepenses] = useState([]);
  const [entrees, setEntrees] = useState([]);
  const [dettes, setDettes] = useState([]);
  const [loading, setLoading] = useState(true);

  // États locaux
  const [tab, setTab] = useState("dashboard");
  const [pereAmount, setPereAmount] = useState(15000);
  const [tanteAmount, setTanteAmount] = useState(0);
  const [formDep, setFormDep] = useState({ date: new Date().toISOString().slice(0,10), label: "", montant: "", categorie: "Alimentation" });
  const [formEnt, setFormEnt] = useState({ date: new Date().toISOString().slice(0,10), label: "", montant: "", categorie: "Prime / Bonus" });
  const [newDette, setNewDette] = useState({ label: "", montant: "" });

  // ── Écoute en temps réel Firestore ──
  useEffect(() => {
    const qDep = query(collection(db, "depenses"), orderBy("date", "desc"));
    const qEnt = query(collection(db, "entrees"), orderBy("date", "desc"));
    const qDet = query(collection(db, "dettes"), orderBy("label"));

    const u1 = onSnapshot(qDep, snap => {
      setDepenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const u2 = onSnapshot(qEnt, snap => {
      setEntrees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const u3 = onSnapshot(qDet, snap => {
      setDettes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { u1(); u2(); u3(); };
  }, []);

  // ── Actions Firebase ──
  const addDepense = async () => {
    if (!formDep.label || !formDep.montant) return;
    await addDoc(collection(db, "depenses"), { ...formDep, montant: parseInt(formDep.montant), createdAt: new Date() });
    setFormDep({ ...formDep, label: "", montant: "" });
  };

  const removeDepense = async (id) => {
    await deleteDoc(doc(db, "depenses", id));
  };

  const addEntree = async () => {
    if (!formEnt.label || !formEnt.montant) return;
    await addDoc(collection(db, "entrees"), { ...formEnt, montant: parseInt(formEnt.montant), createdAt: new Date() });
    setFormEnt({ ...formEnt, label: "", montant: "" });
  };

  const removeEntree = async (id) => {
    await deleteDoc(doc(db, "entrees", id));
  };

  const addDette = async () => {
    if (!newDette.label || !newDette.montant) return;
    await addDoc(collection(db, "dettes"), { label: newDette.label, montant: parseInt(newDette.montant), payee: false });
    setNewDette({ label: "", montant: "" });
  };

  const toggleDette = async (id, currentState) => {
    await updateDoc(doc(db, "dettes", id), { payee: !currentState });
  };

  // ── Calculs ──
  const totalDep = depenses.reduce((s,d) => s+d.montant, 0);
  const totalEnt = entrees.reduce((s,e) => s+e.montant, 0);
  const chargsFixes = TONTINE1 + TONTINE2 + pereAmount + tanteAmount;
  const solde = (SALAIRE + totalEnt) - (chargsFixes + totalDep);

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh", fontFamily:"sans-serif",color:"#4f46e5"}}>
      ⏳ Chargement de vos données sécurisées...
    </div>
  );

  return (
    <div style={{fontFamily:"sans-serif", maxWidth:"600px", margin:"0 auto", padding:"20px", backgroundColor:"#f9fafb", minHeight:"100vh"}}>
      <header style={{textAlign:"center", marginBottom:"20px"}}>
        <h1 style={{color:"#1f2937", marginBottom:"5px"}}>Mon Budget App</h1>
        <div style={{fontSize:"1.5rem", fontWeight:"bold", color: solde >= 0 ? "#10b981" : "#ef4444"}}>
          Solde : {solde.toLocaleString()} CFA
        </div>
      </header>

      {/* Navigation Rapide */}
      <nav style={{display:"flex", gap:"10px", marginBottom:"20px", justifyContent:"center"}}>
        <button onClick={() => setTab("dashboard")} style={btnStyle(tab === "dashboard")}>Dashboard</button>
        <button onClick={() => setTab("depenses")} style={btnStyle(tab === "depenses")}>Dépenses</button>
        <button onClick={() => setTab("dettes")} style={btnStyle(tab === "dettes")}>Dettes</button>
      </nav>

      {tab === "dashboard" && (
        <section>
          <div style={cardStyle}>
            <h3>Résumé du mois</h3>
            <p>Salaire fixe : 250,000 CFA</p>
            <p>Tontines : {TONTINE1 + TONTINE2} CFA</p>
            <p>Extras (Entrées) : +{totalEnt.toLocaleString()} CFA</p>
            <p>Dépenses : -{totalDep.toLocaleString()} CFA</p>
          </div>
        </section>
      )}

      {tab === "depenses" && (
        <section>
          <div style={cardStyle}>
            <h3>Ajouter une dépense</h3>
            <input type="text" placeholder="Quoi ?" value={formDep.label} onChange={e => setFormDep({...formDep, label: e.target.value})} style={inputStyle}/>
            <input type="number" placeholder="Montant" value={formDep.montant} onChange={e => setFormDep({...formDep, montant: e.target.value})} style={inputStyle}/>
            <select value={formDep.categorie} onChange={e => setFormDep({...formDep, categorie: e.target.value})} style={inputStyle}>
              {CATEGORIES_DEP.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addDepense} style={saveBtnStyle}>Enregistrer</button>
          </div>

          <ul style={{listStyle:"none", padding:0}}>
            {depenses.map(d => (
              <li key={d.id} style={itemStyle}>
                <span>{d.label} ({d.categorie})</span>
                <span style={{fontWeight:"bold"}}>-{d.montant} F</span>
                <button onClick={() => removeDepense(d.id)} style={delBtnStyle}>x</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "dettes" && (
        <section>
          <div style={cardStyle}>
            <h3>Suivi des Dettes</h3>
            <input type="text" placeholder="Prêteur / Objet" value={newDette.label} onChange={e => setNewDette({...newDette, label: e.target.value})} style={inputStyle}/>
            <input type="number" placeholder="Montant" value={newDette.montant} onChange={e => setNewDette({...newDette, montant: e.target.value})} style={inputStyle}/>
            <button onClick={addDette} style={saveBtnStyle}>Ajouter Dette</button>
          </div>
          {dettes.map(dt => (
            <div key={dt.id} style={{...itemStyle, opacity: dt.payee ? 0.5 : 1}}>
              <span style={{textDecoration: dt.payee ? "line-through" : "none"}}>{dt.label} : {dt.montant} F</span>
              <button onClick={() => toggleDette(dt.id, dt.payee)} style={{backgroundColor: dt.payee ? "#10b981" : "#6b7280", color:"white", border:"none", padding:"5px 10px", borderRadius:"4px"}}>
                {dt.payee ? "Payée" : "À payer"}
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// Styles simples
const btnStyle = (active) => ({
  padding: "10px 15px",
  backgroundColor: active ? "#4f46e5" : "#e5e7eb",
  color: active ? "white" : "#374151",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold"
});

const cardStyle = {
  backgroundColor: "white",
  padding: "15px",
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  marginBottom: "20px"
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box"
};

const itemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "white",
  padding: "10px",
  marginBottom: "5px",
  borderRadius: "8px",
  borderLeft: "4px solid #ef4444"
};

const saveBtnStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#4f46e5",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const delBtnStyle = {
  backgroundColor: "transparent",
  color: "#ef4444",
  border: "none",
  fontSize: "1.2rem",
  cursor: "pointer"
};