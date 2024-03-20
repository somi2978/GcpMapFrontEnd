import { Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import './App.css';
import './tailwinds.css';

// Pages
import Home from "./pages/Home.js"

// Modules
import Menu from "./modules/Menu.js"
import Footer from "./modules/Footer.js"

function App() {
  const [LogTry, SetLogTry] = useState(false);
  const [ID, SetID] = useState("");
  const [WroteCode, SetWroteCode] = useState("");

  useState(()=>{
    if(!LogTry){
      if(localStorage.getItem('wrotecode')){
        SetID(localStorage.getItem('id'));
        SetWroteCode(localStorage.getItem('wrotecode'));
      }
      SetLogTry(true);
    }
  },[LogTry]);

  return (
    <div className="App">
      <div className="Top-Menu-Fix">
        <Menu ID={ID} WroteCode={WroteCode}/>
      </div>
      <Routes>
        <Route path="/" element={<Home ID={ID} WroteCode={WroteCode} /> } />
      </Routes>
      <div className="Top-Footer-Fix">
        <Footer />
      </div>
    </div>
  );
}

export default App;
