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
  Trash2,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isAdmin, disburseSalary, accounts, settings, branches } = useApp();
  const isBn = false;
  const lang = settings.language;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payingEmployee, setPayingEmployee] = useState<Employee | null>(null);
  const [payMonth, setPayMonth] = useState('October 2026');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(0);

  // Delete Employee State
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

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
      position: position.trim() || 'Staff',
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
    setPayMonth('October 2026');
    setPayAccountId(accounts[0]?.id || '');
  };

  const handleSubmitSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingEmployee || payAmount <= 0) return;

    disburseSalary(payingEmployee.id, payMonth, payAccountId, payAmount);
    alert(`Salary of ৳${payAmount} for ${payMonth} disbursed successfully to ${payingEmployee.name}!`);
    setPayingEmployee(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>{'Employees & Payroll'}</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {'Manage staff roles, permissions & salary disbursements'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{'Add Employee'}</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{'Name & Position'}</th>
                <th className="px-4 py-3 font-semibold">{'Mobile'}</th>
                <th className="px-4 py-3 font-semibold">{'System Role'}</th>
                <th className="px-4 py-3 font-semibold">{'Joining Date'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Salary'}</th>
                <th className="px-4 py-3 font-semibold text-right">{'Actions'}</th>
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenPaySalary(emp)}
                        className="flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{'Pay Salary'}</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setEmployeeToDelete(emp)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title={'Delete Employee (Admin Only)'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                {'Pay Salary'}
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
                <span className="text-slate-500 block">Employee:</span>
                <span className="font-bold text-sm text-slate-900 block">{payingEmployee.name} ({payingEmployee.position})</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Salary Month *'}</label>
                <input
                  type="text"
                  required
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Amount *'}</label>
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
                <label className="block font-medium text-slate-700 mb-1">{'Deduct From'}</label>
                <select
                  aria-label={'Deduct From Account'}
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Balance: ৳{a.balance})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border">
                Salary payment will be recorded under 'Staff Salary' and deducted from the selected account.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setPayingEmployee(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Confirm Payment'}
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
                {'Register New Employee'}
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
                <label className="block font-medium text-slate-700 mb-1">{'Name *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">{'Mobile *'}</label>
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
                  <label className="block font-medium text-slate-700 mb-1">{'Position'}</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Salesman"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Role'}</label>
                  <select
                    aria-label={'Role'}
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white capitalize"
                  >
                    <option value="salesman">Salesman</option>
                    <option value="manager">Manager</option>
                    <option value="storekeeper">Storekeeper</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">{'Monthly Salary *'}</label>
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
                  <label className="block font-medium text-slate-700 mb-1">{'Joining Date'}</label>
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
                {'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                {'Save Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {'Delete Employee?'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {employeeToDelete.name} ({employeeToDelete.position})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-medium text-slate-800">
                {'Are you sure you want to delete this employee record? This action will be recorded in the audit logs.'}
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700 text-xs">
                <div className="flex justify-between">
                  <span>{'Position & Role'}:</span>
                  <span className="font-semibold">{employeeToDelete.position} ({employeeToDelete.role})</span>
                </div>
                <div className="flex justify-between">
                  <span>{'Mobile'}:</span>
                  <span className="font-mono">{employeeToDelete.mobile}</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <span>{'Salary'}:</span>
                  <span className="font-mono-num font-bold">{formatCurrency(employeeToDelete.salary, lang)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                disabled={isDeletingEmployee}
                onClick={() => setEmployeeToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingEmployee}
                onClick={() => {
                  setIsDeletingEmployee(true);
                  try {
                    deleteEmployee(employeeToDelete.id);
                    setEmployeeToDelete(null);
                  } finally {
                    setIsDeletingEmployee(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingEmployee ? ('Deleting...') : ('Delete Employee')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
