'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, HardHat } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { companyProjectsRef } from '@/lib/firestore';
import { isFirebaseConfigured } from '@/lib/firebase';

export default function NewProjectPage() {
  const router = useRouter();
  const { companyId, companies } = useCompany();
  const membership = companies.find((c) => c.companyId === companyId);
  const isClient = membership?.role === 'client';

  const [name, setName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [totalContractValue, setTotalContractValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [estimatedFinishDate, setEstimatedFinishDate] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'on_hold' | 'completed'>('active');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr('Project name is required.');
      return;
    }
    if (!companyId || !isFirebaseConfigured()) {
      setErr('Select a company and ensure Firebase is configured.');
      return;
    }
    if (isClient) {
      setErr('Clients cannot create projects.');
      return;
    }

    const site = siteAddress.trim();
    const contractNum = totalContractValue.trim() === '' ? null : Number(totalContractValue.replace(/,/g, ''));
    const contractValue =
      contractNum !== null && Number.isFinite(contractNum) && contractNum >= 0 ? contractNum : null;

    setSaving(true);
    try {
      const ref = await addDoc(companyProjectsRef(companyId), {
        name: trimmedName,
        siteAddress: site,
        location: site,
        client: clientName.trim() || '',
        totalContractValue: contractValue,
        budget: contractValue,
        startDate: startDate.trim() || '',
        estimatedFinishDate: estimatedFinishDate.trim() || '',
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.replace(`/dashboard/projects/${encodeURIComponent(ref.id)}`);
    } catch {
      setErr('Could not save project. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isClient) {
    return (
      <div className="min-h-full bg-[#FDFDFD] p-6 sm:p-8 md:p-12" dir="ltr">
        <p className="text-center text-slate-600">You do not have permission to create projects.</p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard/projects" className="text-slate-900 underline underline-offset-4">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FDFDFD] p-4 pb-16 sm:p-8 md:p-12" dir="ltr">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
          <Link
            href="/dashboard/projects"
            className="inline-flex min-h-12 items-center justify-center gap-4 rounded-[32px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All projects
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-[32px] px-4 py-2 text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>

        <header className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="rounded-[32px] bg-[#004694]/10 p-3">
            <HardHat className="h-8 w-8 text-[#004694]" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Create new project</h1>
          <p className="text-sm text-slate-500">
            bsd-ybm · Jerusalem Builders ERP v6 — Firestore <code className="rounded bg-slate-100 px-1">companies/…/projects</code>
          </p>
        </header>

        {!companyId && (
          <p className="rounded-[32px] border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
            Select a company from the header switcher first.
          </p>
        )}

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Project name <span className="font-normal text-red-600">*</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              placeholder="e.g. Penthouse finish — Katamon"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Site address (Jerusalem area)
            <input
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              placeholder="Jerusalem — neighborhood, street, no."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Client name
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              placeholder="Client or company"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Total contract value (₪, optional)
            <input
              value={totalContractValue}
              onChange={(e) => setTotalContractValue(e.target.value)}
              inputMode="decimal"
              className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              placeholder="0"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Estimated finish
              <input
                type="date"
                value={estimatedFinishDate}
                onChange={(e) => setEstimatedFinishDate(e.target.value)}
                className="min-h-12 rounded-[32px] border border-slate-200 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#004694]/40"
              />
            </label>
          </div>

          {err && <p className="text-center text-sm text-red-600">{err}</p>}

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !companyId || !isFirebaseConfigured()}
              className="min-h-12 w-full rounded-[32px] bg-[#004694] px-8 py-3 font-semibold text-white transition-opacity disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save project'}
            </button>
            <Link
              href="/dashboard/projects"
              className="min-h-12 w-full rounded-[32px] border border-slate-200 px-8 py-3 text-center font-semibold text-slate-700 sm:w-auto"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
