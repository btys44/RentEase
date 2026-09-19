import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile section
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences section
  const [receiveSms, setReceiveSms] = useState(user?.receiveSmsNotifications ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name, phone });
      if (user) updateUser({ ...user, name: res.data.name, phone: res.data.phone });
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePassword() {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Enter your current password.';
    if (!newPassword) errs.newPassword = 'Enter a new password.';
    else if (newPassword.length < 6) errs.newPassword = 'New password must be at least 6 characters.';
    if (newPassword && confirmPassword !== newPassword) errs.confirmPassword = 'Passwords do not match.';
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function togglePreference() {
    const next = !receiveSms;
    setReceiveSms(next);
    setSavingPrefs(true);
    try {
      await api.put('/auth/preferences', { receiveSmsNotifications: next });
      if (user) updateUser({ ...user, receiveSmsNotifications: next });
      toast.success('Preference saved.');
    } catch (err) {
      setReceiveSms(!next);
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPrefs(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile, password, and notification preferences</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="card space-y-4">
        <h2 className="font-semibold text-lg">Profile</h2>
        <div>
          <label className="label">Full Name</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input-field bg-gray-50 text-gray-500" value={user?.email} disabled />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
        </div>
        <button type="submit" disabled={savingProfile} className="btn-primary">
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="card space-y-4">
        <h2 className="font-semibold text-lg">Change Password</h2>
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={passwordErrors.currentPassword}
        />
        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="At least 6 characters"
          error={passwordErrors.newPassword}
        />
        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={passwordErrors.confirmPassword}
        />
        <button type="submit" disabled={savingPassword} className="btn-primary">
          {savingPassword ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Notification Preferences</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
            <p className="text-xs text-gray-500">Receive an SMS when a payment is recorded</p>
          </div>
          <button
            type="button"
            onClick={togglePreference}
            disabled={savingPrefs}
            className={`w-11 h-6 rounded-full transition-colors relative ${receiveSms ? 'bg-brand-700' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 bg-white rounded-full transition-transform ${receiveSms ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}