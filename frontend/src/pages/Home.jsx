import { useState, useEffect } from "react";
// import Note from "../components/Note"
import api from "../api";
import "../styles/Home.css"

function Home() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

 
  return (
    <div>
      Hello
    </div>
  );
}

export default Home;
