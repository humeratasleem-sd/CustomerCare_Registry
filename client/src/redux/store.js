import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import complaintReducer from './slices/complaintSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // allows passing FormData dates cleanly
    })
});

export default store;
