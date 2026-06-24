import { Homly } from '../core/homly.js';

// Estado global de UI compartido entre componentes (modal de checkout / WhatsApp).
export const uiStore = Homly.createStore({
  modalOpen: false,
  modalPlan: '',
  modalLabel: ' ',
  modalPrice: ' ',
  waLink: '',
});

// Abre el modal de checkout con los datos del plan elegido.
export function openCheckoutModal(planData) {
  uiStore.state.modalPlan = planData.plan;
  uiStore.state.modalLabel = planData.label;
  uiStore.state.modalPrice = planData.price;
  uiStore.state.waLink = planData.waLink;
  uiStore.state.modalOpen = true;
}
