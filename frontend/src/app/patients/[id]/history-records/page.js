'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import { ArrowLeft, CalendarDays, FileText, UserRound } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

export default function PatientHistoryRecords() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadPatient = async () => {
      const token = localStorage.getItem('haqms_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load patient history.');
        }

        if (isMounted) {
          setPatient(data);
          setError('');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPatient();

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="glass p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-sm font-semibold text-slate-400">
            Loading clinical record...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{patient.name}</h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {patient.gender} | {patient.age} years | {patient.phoneNumber}
                  </p>
                  {patient.email && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{patient.email}</p>}
                </div>
              </div>
            </section>

            <section className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-teal-600" />
                Clinical Background
              </h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {patient.medicalHistory || 'No clinical background has been recorded for this patient yet.'}
              </p>
            </section>

            <section className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-teal-600" />
                Appointment History
              </h2>

              {patient.appointments.length === 0 ? (
                <p className="text-sm text-slate-400 font-semibold">No appointments are linked to this patient.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {patient.appointments.map((appointment) => (
                    <div key={appointment.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {new Date(appointment.appointmentDate).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{appointment.reason || 'No reason recorded'}</p>
                      </div>
                      <span className="w-fit px-2.5 py-1 rounded text-xxs font-extrabold tracking-wide uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
