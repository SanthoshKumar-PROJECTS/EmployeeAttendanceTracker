import { create } from 'zustand';

const useAlertStore = create((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  options: {},

  showAlert: (title, message, buttons = [{ text: 'OK' }], options = {}) => set({
    isVisible: true,
    title: title || '',
    message: message || '',
    buttons,
    options
  }),

  hideAlert: () => set((state) => ({ ...state, isVisible: false })),
}));

export default useAlertStore;
