// The character sheet's entry point (sheet.html, development only).
import { mount } from "svelte";
import CharacterSheet from "./CharacterSheet.svelte";
import "../styles/app.css";

const theme = new URLSearchParams(location.search).get("theme");
document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
mount(CharacterSheet, { target: document.getElementById("sheet")! });
