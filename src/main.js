import { VOCABULARY_DATA } from "../vocabulary-data.js";
import { createApp } from "./app/controller.js";

createApp({
  rawVocabulary: VOCABULARY_DATA,
  document: window.document,
}).bootstrap();
