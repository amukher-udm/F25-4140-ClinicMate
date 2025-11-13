import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const steps = ['provider', 'visitType', 'slot', 'review', 'confirmation'];

const initialState = {
  step: steps[0],
  provider: null,
  visitType: null,
  slot: null,
  notes: '',
  meta: {},
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PROVIDER':
      return {
        ...state,
        provider: action.payload,
        visitType: null,
        slot: null,
        step: 'visitType',
        error: null,
      };
    case 'SELECT_VISIT_TYPE':
      return {
        ...state,
        visitType: action.payload,
        slot: null,
        step: 'slot',
        error: null,
      };
    case 'SELECT_SLOT':
      return {
        ...state,
        slot: action.payload,
        step: 'review',
        error: null,
      };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'SET_META':
      return { ...state, meta: { ...state.meta, ...action.payload } };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'GO_TO_STEP':
      return steps.includes(action.payload)
        ? { ...state, step: action.payload }
        : state;
    case 'NEXT_STEP': {
      const currentIndex = steps.indexOf(state.step);
      const next = steps[Math.min(currentIndex + 1, steps.length - 1)];
      return { ...state, step: next };
    }
    case 'PREV_STEP': {
      const currentIndex = steps.indexOf(state.step);
      const prev = steps[Math.max(currentIndex - 1, 0)];
      return { ...state, step: prev };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_FLOW':
      return { ...initialState, meta: action.payload?.meta || {} };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const AppointmentContext = createContext(null);

export function AppointmentProvider({ children, persistedState }) {
  const [state, dispatch] = useReducer(
    reducer,
    persistedState ? { ...initialState, ...persistedState } : initialState
  );

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('appointment_flow:update', { detail: state })
    );
  }, [state]);

  const actionCreators = useMemo(
    () => ({
      selectProvider: (provider) =>
        dispatch({ type: 'SELECT_PROVIDER', payload: provider }),
      selectVisitType: (visitType) =>
        dispatch({ type: 'SELECT_VISIT_TYPE', payload: visitType }),
      selectSlot: (slot) => dispatch({ type: 'SELECT_SLOT', payload: slot }),
      setNotes: (notes) => dispatch({ type: 'SET_NOTES', payload: notes }),
      setMeta: (meta) => dispatch({ type: 'SET_META', payload: meta }),
      setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
      setLoading: (loading) =>
        dispatch({ type: 'SET_LOADING', payload: loading }),
      reset: (meta) => dispatch({ type: 'RESET_FLOW', payload: { meta } }),
      hydrate: (data) => dispatch({ type: 'HYDRATE', payload: data }),
      goToStep: (stepName) =>
        dispatch({ type: 'GO_TO_STEP', payload: stepName }),
      nextStep: () => dispatch({ type: 'NEXT_STEP' }),
      prevStep: () => dispatch({ type: 'PREV_STEP' }),
    }),
    [dispatch]
  );

  const value = useMemo(() => {
    const currentIndex = steps.indexOf(state.step);
    const canGoBack = currentIndex > 0;
    const canAdvance =
      (state.step === 'provider' && !!state.provider) ||
      (state.step === 'visitType' && !!state.visitType) ||
      (state.step === 'slot' && !!state.slot) ||
      state.step === 'review';

    return {
      state,
      steps,
      currentIndex,
      canGoBack,
      canAdvance,
      dispatch,
      actions: actionCreators,
    };
  }, [state, actionCreators]);

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointmentFlow() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointmentFlow requires AppointmentProvider');
  return ctx;
}
