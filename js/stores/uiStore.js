import { Homly } from 'homly';

// Estado global de UI compartido entre componentes (modal de checkout / WhatsApp).
export const uiStore = Homly.createStore({
  modalOpen: false,
  modalPlan: '',
  modalLabel: ' ',
  modalPrice: ' ',
  // Arranca con el link genérico, no vacío: data-bind-attr hace removeAttribute con
  // valores falsy, y un <a> sin href deja de ser rastreable (lo marcaba Lighthouse).
  waLink: 'https://wa.me/584145200715',
});

// Abre el modal de checkout con los datos del plan elegido.
export function openCheckoutModal(planData) {
  uiStore.state.modalPlan = planData.plan;
  uiStore.state.modalLabel = planData.label;
  uiStore.state.modalPrice = planData.price;
  uiStore.state.waLink = planData.waLink;
  uiStore.state.modalOpen = true;
}
