import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, UserRole } from '../../types';
import { formatCurrency, formatDate, toBnNumber } from '../../utils/formatters';
import {
  UserCheck,
  Plus,
  CreditCard,
  X,
  Phone,
  Briefcase,
  Shield,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, addEmployee, updateEmployee, disburseSalary, accounts, settings, branches } = useApp();
  const isBn = settings.language === 'bn';
  const lang = settings.language;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
  const [payMonth, setPayMonth] = useState('সেপ্টেম্বর ২০২৬');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(0);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [salary, setSalary] = useState<number | ''>('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));

  const handleOpenAdd = () => {
    setName('');
    setMobile('');
    setPosition('');
    setRole('salesman');
    setSalary('');
    setJoiningDate(new Date().toISOString().slice(0, 10));
    setIsAddModalOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !salary) return;

    addEmployee({
      name: name.trim(),
      mobile: mobile.trim(),
      position: position.trim() || 'স্টাফ',
      role,
      salary: Number(salary),
      joiningDate,
      branchId: branches[0]?.id || 'branch-1',
      status: 'active',
    });

    setIsAddModalOpen(false);
  };

  const handleOpenPaySalary = (emp: Employee) => {
    setPayingEmployee(emp);
    setPayAmount(emp.salary);
    setPayMonth('সেপ্টেম্বর ২০২৬');
    setPayAccountId(accounts[0]?.id || '');
  };

  const handleSubmitSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingEmployee || payAmount <= 0) return;

    disburseSalary(payingEmployee.id, payMonth, payAccountId, payAmount);
    alert(isBn ? `${payingEmployee.name}-এর ${payMonth} মাসের বেতন সফলভাবে প্রদান করা হয়েছে!` : 'Salary disbursed successfully!');
    setPayingEmployee(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>{isBn ? 'কর্মচারী ও বেতন ব্যবস্থাপনা (Employees & Payroll)' : 'Employees & Payroll'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isBn ? 'স্টাফদের দায়িত্ব, রোল ও মাসিক বেতন পরিচালনা' : 'Manage staff roles, permissions & salary disbursements'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'নতুন কর্মচারী যোগ' : 'Add Employee'}</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{isBn ? 'নাম ও পদবি' : 'Name & Position'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'মোবাইল' : 'Mobile'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'সিস্টেম রোল' : 'System Role'}</th>
                <th className="px-4 py-3 font-semibold">{isBn ? 'যোগদানের তারিখ' : 'Joining Date'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'মাসিক বেতন' : 'Salary'}</th>
                <th className="px-4 py-3 font-semibold text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{emp.name}</div>
                    <span className="text-[11px] text-slate-500">{emp.position}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{emp.mobile}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.joiningDate}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                    {formatCurrency(emp.salary, lang)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenPaySalary(emp)}
                      className="flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold transition-colors ml-auto"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'বেতন দিন' : 'Pay Salary'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Salary Modal */}
      {payingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitSalary}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {isBn ? 'বেতন প্রদান (Disburse Salary)' : 'Pay Salary'}
              </h3>
              <button
                type="button"
                onClick={() => setPayingEmployee(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">কর্মচারী:</span>
                <span className="font-bold text-sm text-slate-900 block">{payingEmployee.name} ({payingEmployee.position})</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'যে মাসের বেতন *' : 'Salary Month *'}</label>
                <input
                  type="text"
                  required
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'টাকার পরিমাণ *' : 'Amount *'}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono-num font-bold text-base text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'যে অ্যাকাউন্ট থেকে দেওয়া হবে' : 'Deduct From'}</label>
                <select
                  aria-label={isBn ? 'যে অ্যাকাউন্ট থেকে দেওয়া হবে' : 'Deduct From Account'}
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (ব্যালেন্স: ৳{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border">
                বেতন প্রদানের সাথে সাথে তা 'স্টাফ বেতন' খরচের খাতে যুক্ত হবে এবং নির্বাচিত অ্যাকাউন্ট ব্যালেন্স থেকে কর্তন হবে।
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setPayingEmployee(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isBn ? 'বেতন সম্পন্ন করুন' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitAdd}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {isBn ? 'নতুন কর্মচারী নিবন্ধন' : 'Register New Employee'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'নাম *' : 'Name *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. তানভীর হাসান"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর *' : 'Mobile *'}</label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'পদবি (Position)' : 'Position'}</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. সেলসম্যান"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'সিস্টেম রোল' : 'Role'}</label>
                  <select
                    aria-label={isBn ? 'সিস্টেম রোল নির্বাচন' : 'Role'}
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                  >
                    <option value="salesman">Salesman (সেলসম্যান)</option>
                    <option value="manager">Manager (ম্যানেজার)</option>
                    <option value="storekeeper">Storekeeper (স্টোরকিপার)</option>
                    <option value="accountant">Accountant (হিসাবরক্ষক)</option>
                    <option value="admin">Admin (অ্যাডমিন)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'মাসিক বেতন (৳) *' : 'Monthly Salary *'}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="15000"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{isBn ? 'যোগদানের তারিখ' : 'Joining Date'}</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {isBn ? 'সংরক্ষণ করুন' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
