import Chat from "../components/Chat/classes/Chat.js";
import "../components/Chat/css/style.css";


document.addEventListener("DOMContentLoaded", () => {
  const parentNode = document.querySelector('.Frontend');
  const chat = new Chat(parentNode);
});
