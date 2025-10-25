/**
 * useModalState Hook
 *
 * Centralized state management for all modal dialogs and navigation.
 * Replaces scattered useState calls for modal visibility and selections.
 */

import { useState, useCallback } from 'react';

/**
 * Modal types in the application
 */
export type ModalType =
  | 'variant-picker'
  | 'mode-picker'
  | 'game-setup'
  | 'color-picker'
  | 'help'
  | 'resign-confirm'
  | null;

/**
 * Modal state interface
 */
export interface ModalState {
  currentModal: ModalType;
  selectedCategoryId: string | null;
  selectedModeId: string | null;
  helpModeId: string | null;
  hintLevel: number;
}

/**
 * Modal actions interface
 */
export interface ModalActions {
  showVariantPicker: () => void;
  showModePicker: (categoryId: string) => void;
  showGameSetup: (modeId: string) => void;
  showColorPicker: () => void;
  showHelp: (modeId: string) => void;
  showResignConfirm: () => void;
  closeModal: () => void;
  setHintLevel: (level: number) => void;
  reset: () => void;
}

const initialState: ModalState = {
  currentModal: null,
  selectedCategoryId: null,
  selectedModeId: null,
  helpModeId: null,
  hintLevel: 0,
};

/**
 * Hook for managing modal state
 *
 * Provides a single source of truth for all modal visibility and navigation.
 */
export function useModalState(): [ModalState, ModalActions] {
  const [state, setState] = useState<ModalState>(initialState);

  const actions: ModalActions = {
    showVariantPicker: useCallback(() => {
      setState({
        ...initialState,
        currentModal: 'variant-picker',
      });
    }, []),

    showModePicker: useCallback((categoryId: string) => {
      setState((prev) => ({
        ...prev,
        currentModal: 'mode-picker',
        selectedCategoryId: categoryId,
        selectedModeId: null, // Clear previous mode selection
      }));
    }, []),

    showGameSetup: useCallback((modeId: string) => {
      setState((prev) => ({
        ...prev,
        currentModal: 'game-setup',
        selectedModeId: modeId,
      }));
    }, []),

    showColorPicker: useCallback(() => {
      setState((prev) => ({
        ...prev,
        currentModal: 'color-picker',
      }));
    }, []),

    showHelp: useCallback((modeId: string) => {
      setState((prev) => ({
        ...prev,
        currentModal: 'help',
        helpModeId: modeId,
        hintLevel: 0,
      }));
    }, []),

    showResignConfirm: useCallback(() => {
      setState((prev) => ({
        ...prev,
        currentModal: 'resign-confirm',
      }));
    }, []),

    closeModal: useCallback(() => {
      setState((prev) => ({
        ...prev,
        currentModal: null,
        hintLevel: 0,
      }));
    }, []),

    setHintLevel: useCallback((level: number) => {
      setState((prev) => ({
        ...prev,
        hintLevel: level,
      }));
    }, []),

    reset: useCallback(() => {
      setState(initialState);
    }, []),
  };

  return [state, actions];
}
