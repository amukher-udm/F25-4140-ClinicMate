const defaultHeaders = { 'Content-Type': 'application/json' };

async function request(path, { token, ...options } = {}) {
  const headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const payload = await res.json();
      message = payload.error || payload.message || message;
      throw Object.assign(new Error(message), {
        status: res.status,
        payload,
      });
    } catch (err) {
      if (err.payload) throw err;
      const text = await res.text();
      throw Object.assign(new Error(message), {
        status: res.status,
        payload: text,
      });
    }
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getProviders({ search, specialtyId, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('q', search);
  if (specialtyId) params.append('specialty_id', specialtyId);
  params.append('limit', limit);

  try {
    return await request(`/api/providers?${params.toString()}`);
  } catch (err) {
    if (err.status === 404) {
      const explore = await request('/api/explore_page');
      return explore.doctors || [];
    }
    throw err;
  }
}

export async function getVisitTypes(providerId, token) {
  try {
    return await request(`/api/providers/${providerId}/visit-types`, { token });
  } catch (err) {
    if (err.status === 404) {
      // Fallback: Return common visit types
      return [
        { value: 'new_patient', label: 'New Patient Visit' },
        { value: 'follow_up', label: 'Follow-up Visit' },
        { value: 'sick_visit', label: 'Sick Visit' },
        { value: 'annual_physical', label: 'Annual Physical' },
      ];
    }
    throw err;
  }
}

// Fixed: Backend uses /api/provider_availability/:id/slots with date query param
export function getSlots({ providerId, date }, token) {
  const params = new URLSearchParams({ date });
  return request(`/api/provider_availability/${providerId}/slots?${params.toString()}`, {
    token,
  });
}

// Create a new appointment
export function createAppointment(payload, token) {
  return request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

// Update appointment details (visit_type, reason/notes)
export function updateAppointment(id, body, token) {
  return request(`/api/appointments/${id}/update`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

// Fixed: Backend uses PATCH method, not POST
export function rescheduleAppointment(id, payload, token) {
  return request(`/api/appointments/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

// Cancel an appointment
export function cancelAppointment(id, token) {
  return request(`/api/appointments/${id}/cancel`, {
    method: 'PATCH',
    token,
  });
}

// Fixed: Backend uses status, sort_by, and order params (not page/pageSize)
export function listAppointments({ status, sortBy = 'date', order = 'desc' } = {}, token) {
  const params = new URLSearchParams({ sort_by: sortBy, order });
  if (status && status !== 'all') params.append('status', status);
  return request(`/api/appointments?${params.toString()}`, { token });
}