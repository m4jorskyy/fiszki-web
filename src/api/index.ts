import { login } from "./auth/login";
import { register } from "./auth/register";
import { refresh } from "./auth/refresh";
import { logout } from "./auth/logout";
import { getMe } from "./auth/getMe";
import { listDecks } from "./decks/listDecks";
import { getDeck } from "./decks/getDeck";
import { createDeck } from "./decks/createDeck";
import { updateDeck } from "./decks/updateDeck";
import { deleteDeck } from "./decks/deleteDeck";
import { exportDeck } from "./decks/exportDeck";
import { importDeck } from "./decks/importDeck";
import { listCards } from "./cards/listCards";
import { getCard } from "./cards/getCard";
import { createCard } from "./cards/createCard";
import { bulkCreateCards } from "./cards/bulkCreateCards";
import { updateCard } from "./cards/updateCard";
import { deleteCard } from "./cards/deleteCard";
import { extractFromPhoto } from "./cards/extractFromPhoto";
import { getDueCards } from "./study/getDueCards";
import { submitReview } from "./study/submitReview";
import { getStatsOverview } from "./stats/getStatsOverview";

export {
  ApiError,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
} from "./client";

export {
  login,
  register,
  refresh,
  logout,
  getMe,
  listDecks,
  getDeck,
  createDeck,
  updateDeck,
  deleteDeck,
  exportDeck,
  importDeck,
  listCards,
  getCard,
  createCard,
  bulkCreateCards,
  updateCard,
  deleteCard,
  extractFromPhoto,
  getDueCards,
  submitReview,
  getStatsOverview,
};

export const fiszkiApi = {
  register,
  login,
  refresh,
  logout,
  getMe,
  listDecks,
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
  exportDeck,
  importDeck,
  listCards,
  createCard,
  bulkCreateCards,
  extractFromPhoto,
  getCard,
  updateCard,
  deleteCard,
  getDueCards,
  submitReview,
  getStatsOverview,
};
