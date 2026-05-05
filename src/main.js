import { RADICALS_DATA, VOCABULARY_DATA } from "../vocabulary-data.js";
import { createApp } from "./app/controller.js";

createApp({
  rawVocabulary: VOCABULARY_DATA,
  rawRadicals: RADICALS_DATA,
  document: window.document,
}).bootstrap();
