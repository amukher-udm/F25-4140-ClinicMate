import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ClinicMateAPI {
  constructor() {
    if (ClinicMateAPI.instance) {
      return ClinicMateAPI.instance;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Check .env file.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    ClinicMateAPI.instance = this;
  }

  // --- Normalizers to stabilize API responses across branch/schema diffs ---
  normalizeHospital = (row) => {
    if (!row || typeof row !== 'object') return null;
    const id = row.hospital_id ?? row.id ?? row.hospitalId ?? null;
    const name = row.hospital_name ?? row.name ?? row.hospitalName ?? '';
    // Address can be nested as address: { street, city, state, zip_code }
    const addressObj = row.address || row.address_id || row.addr || null;
    const addr = row.hospital_addr ?? (addressObj ? [addressObj.street, addressObj.city, addressObj.state, addressObj.zip_code].filter(Boolean).join(', ') : '') ?? '';
    const phone = row.phone ?? row.hospital_phone ?? row.phone_number ?? '';
    const open = row.open_hours ?? row.openHours ?? '';
    const country = row.country ?? row.state ?? row.region ?? '';
    return {
      hospital_id: id,
      hospital_name: name,
      hospital_addr: addr,
      phone,
      open_hours: open,
      country,
      // pass through any extra properties (non-breaking)
      ...row
    };
  }

  normalizeDoctor = (row) => {
    if (!row || typeof row !== 'object') return null;
    const id = row.doctor_id ?? row.id ?? row.doctorId ?? null;
    const first = row.first_name ?? row.firstName ?? '';
    const last = row.last_name ?? row.lastName ?? '';
    const avatar = row.avatar_url ?? row.avatarUrl ?? '';
    const title = row.title ?? row.role ?? '';
    // normalize nested relations if present
    const specialty = row.specialty ?? row.speciality ?? null;
    let hospital = row.hospital ?? row.hospitals ?? null;
    if (hospital) {
      // Map nested hospital.name -> hospital_name and phone_number -> phone
      const addrObj = hospital.address || null;
      hospital = {
        ...hospital,
        hospital_id: hospital.hospital_id ?? hospital.id ?? hospital.hospitalId ?? null,
        hospital_name: hospital.hospital_name ?? hospital.name ?? '',
        phone: hospital.phone ?? hospital.phone_number ?? '',
        hospital_addr: hospital.hospital_addr ?? (addrObj ? [addrObj.street, addrObj.city, addrObj.state, addrObj.zip_code].filter(Boolean).join(', ') : '') ?? ''
      };
    }
    return {
      doctor_id: id,
      first_name: first,
      last_name: last,
      avatar_url: avatar,
      title,
      specialty,
      hospital,
      ...row
    };
  }

  // Doctor-related queries
  async searchDoctors({ query = '', filters = {}, page = 1, perPage = 10 }) {
    // Align with provided schema: doctors joins specialty and hospital (which joins address)
    let queryBuilder = this.supabase
      .from('doctors')
      .select(`
        doctor_id, first_name, last_name, email, phone_number, avatar_url,
        specialty:specialty_id ( specialty_id, specialty_name, description ),
        hospital:hospital_id (
          hospital_id, name, email, phone_number,
          address:address_id ( street, city, state, zip_code )
        )
      `, { count: 'exact' });

    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    }
    if (filters.hospitalId) {
      queryBuilder = queryBuilder.eq('hospital_id', filters.hospitalId);
    }
    if (filters.specialtyId) {
      queryBuilder = queryBuilder.eq('specialty_id', filters.specialtyId);
    }

    const { data, error, count } = await queryBuilder
      .range((page - 1) * perPage, page * perPage - 1)
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Doctor query error:', error);
      throw error;
    }

    const doctors = (data || []).map(this.normalizeDoctor).filter(Boolean);
    return { doctors, total: count || 0, page, perPage };
  }

  async getDoctorDetails(doctorId) {
    const { data, error } = await this.supabase
      .from('doctors')
      .select(`
        *,
        specialty:specialty_id (
          specialty_id,
          specialty_name,
          description
        ),
        hospital:hospital_id (
          hospital_id,
          hospital_name,
          hospital_addr,
          country,
          open_hours,
          email,
          phone
        )
      `)
      .eq('doctor_id', doctorId)
      .single();

    if (error) throw error;
    return data;
  }

  // Hospital-related queries
  async searchHospitals({ query = '', filters = {}, page = 1, perPage = 10 }) {
    // Align with provided schema: hospitals has name, phone_number and address_id -> address
    let queryBuilder = this.supabase
      .from('hospitals')
      .select(`
        hospital_id, name, email, phone_number,
        address:address_id ( street, city, state, zip_code )
      `, { count: 'exact' });

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    const { data, error, count } = await queryBuilder
      .range((page - 1) * perPage, page * perPage - 1)
      .order('name', { ascending: true });

    if (error) {
      console.error('Hospital query error:', error);
      throw error;
    }

    const hospitals = (data || []).map(this.normalizeHospital).filter(Boolean);
    return { hospitals, total: count || 0, page, perPage };
  }

  // Appointment management
  async createAppointment({ doctorId, patientId, dateTime, reason }) {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert([{
        doctor_id: doctorId,
        patient_id: patientId,
        visit_type: 'regular', // or emergency
        status: 'pending',
        reason,
        date_time: dateTime
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPatientAppointments(patientId) {
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id (
          first_name,
          last_name,
          avatar_url,
          specialty (
            specialty_name
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('date_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Patient management
  async createPatient({
    firstName,
    lastName,
    email,
    phone,
    address
  }) {
    const { data, error } = await this.supabase
      .from('patients')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        address
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePatient(patientId, updates) {
    const { data, error } = await this.supabase
      .from('patients')
      .update(updates)
      .eq('patient_id', patientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Specialty queries
  async listSpecialties() {
    const { data, error } = await this.supabase
      .from('specialty')
      .select('specialty_id, specialty_name, description')
      .order('specialty_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Utility functions
  formatDateTime(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatAddress(hospital) {
    return `${hospital.hospital_addr}, ${hospital.country}`;
  }
}

export const clinicApi = new ClinicMateAPI();
export default clinicApi;