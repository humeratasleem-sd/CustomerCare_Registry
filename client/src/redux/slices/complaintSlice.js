import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../constants';

const getHeaderConfig = (getState) => {
  const token = getState().auth.token;
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// Async Thunks
export const fetchComplaints = createAsyncThunk(
  'complaints/fetchAll',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      config.params = params;

      const response = await axios.get(`${API_URL}/complaints`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch complaints list.');
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.get(`${API_URL}/complaints/${id}`, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch compilation details.');
    }
  }
);

export const createComplaint = createAsyncThunk(
  'complaints/create',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      config.headers['Content-Type'] = 'multipart/form-data';

      const response = await axios.post(`${API_URL}/complaints`, formData, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to raise complaint ticket.');
    }
  }
);

export const updateComplaintDetail = createAsyncThunk(
  'complaints/update',
  async ({ id, updateData }, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.put(`${API_URL}/complaints/${id}`, updateData, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply ticket updates.');
    }
  }
);

export const acceptTicket = createAsyncThunk(
  'complaints/accept',
  async (id, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.put(`${API_URL}/complaints/${id}/accept`, {}, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept ticket.');
    }
  }
);

export const rejectTicket = createAsyncThunk(
  'complaints/reject',
  async ({ id, comments }, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.put(`${API_URL}/complaints/${id}/reject`, { comments }, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject ticket assignment.');
    }
  }
);

export const resolveTicket = createAsyncThunk(
  'complaints/resolve',
  async ({ id, formData }, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      config.headers['Content-Type'] = 'multipart/form-data';
      
      const response = await axios.post(`${API_URL}/complaints/${id}/resolve`, formData, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record resolution.');
    }
  }
);

export const closeTicket = createAsyncThunk(
  'complaints/close',
  async (id, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.post(`${API_URL}/complaints/${id}/close`, {}, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to close complaint.');
    }
  }
);

export const escalateTicket = createAsyncThunk(
  'complaints/escalate',
  async ({ id, comments }, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.post(`${API_URL}/complaints/${id}/escalate`, { comments }, config);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to escalate ticket.');
    }
  }
);

export const postInternalNote = createAsyncThunk(
  'complaints/addNote',
  async ({ id, note }, { getState, rejectWithValue }) => {
    try {
      const config = getHeaderConfig(getState);
      const response = await axios.post(`${API_URL}/complaints/${id}/notes`, { note }, config);
      return response.data.internalNotes;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save note.');
    }
  }
);

const initialState = {
  complaints: [],
  selectedComplaint: null,
  isLoading: false,
  error: null,
  totalPages: 1,
  totalCount: 0
};

const complaintSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    clearComplaintError: (state) => {
      state.error = null;
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Cases
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints = action.payload.complaints;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Detail Cases
      .addCase(fetchComplaintById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedComplaint = action.payload;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Complaint Cases
      .addCase(createComplaint.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints.unshift(action.payload);
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add Internal Notes case (must come before addMatcher!)
      .addCase(postInternalNote.fulfilled, (state, action) => {
        if (state.selectedComplaint) {
          state.selectedComplaint.internalNotes = action.payload;
        }
      })

      // Update / Status transition mergers
      .addMatcher(
        (action) => [
          updateComplaintDetail.fulfilled.type,
          acceptTicket.fulfilled.type,
          rejectTicket.fulfilled.type,
          resolveTicket.fulfilled.type,
          closeTicket.fulfilled.type,
          escalateTicket.fulfilled.type
        ].includes(action.type),
        (state, action) => {
          state.isLoading = false;
          state.selectedComplaint = action.payload;
          const idx = state.complaints.findIndex(c => c._id === action.payload._id);
          if (idx !== -1) {
            state.complaints[idx] = action.payload;
          }
        }
      )
      .addMatcher(
        (action) => [
          updateComplaintDetail.pending.type,
          acceptTicket.pending.type,
          rejectTicket.pending.type,
          resolveTicket.pending.type,
          closeTicket.pending.type,
          escalateTicket.pending.type
        ].includes(action.type),
        (state) => {
          state.isLoading = true;
        }
      )
      .addMatcher(
        (action) => [
          updateComplaintDetail.rejected.type,
          acceptTicket.rejected.type,
          rejectTicket.rejected.type,
          resolveTicket.rejected.type,
          closeTicket.rejected.type,
          escalateTicket.rejected.type
        ].includes(action.type),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        }
      );
  }
});

export const { clearComplaintError, clearSelectedComplaint } = complaintSlice.actions;
export default complaintSlice.reducer;
