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
      const providers = await request('/api/explore_page');
      const doctor = providers.doctors?.find(
        (doc) => String(doc.doctor_id) === String(providerId)
      );
      return doctor?.specialty ? [doctor.specialty] : [];
    }
    throw err;
  }
}

export function getSlots({ providerId, date }, token) {
  const params = new URLSearchParams({ date });
  return request(`/api/providers/${providerId}/slots?${params.toString()}`, {
    token,
  });
}

export function createAppointment(payload, token) {
  return request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function updateAppointment(id, body, token) {
  return request(`/api/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export function rescheduleAppointment(id, payload, token) {
  return request(`/api/appointments/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function listAppointments({ status, page = 1, pageSize = 10 } = {}, token) {
  const params = new URLSearchParams({ page, pageSize });
  if (status) params.append('status', status);
  return request(`/api/appointments?${params.toString()}`, { token });
}
