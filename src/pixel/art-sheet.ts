// The art sheet's entry point (art.html, development only).
import { mount } from "svelte";
import ArtSheet from "./ArtSheet.svelte";
import "../styles/app.css";

const theme = new URLSearchParams(location.search).get("theme");
document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
mount(ArtSheet, { target: document.getElementById("sheet")! });
