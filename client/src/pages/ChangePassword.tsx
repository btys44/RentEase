import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../utils/api';
import PasswordInput from '../components/PasswordInput';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Enter your current password.';
    if (!newPassword) errs.newPassword = 'Enter a new password.';
    else if (newPassword.length < 6) errs.newPassword = 'New password must be at least 6 characters.';
    if (newPassword && confirmPassword !== newPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
        <p className="text-gray-500 text-sm">Update the password used to log in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.currentPassword}
        />
        <PasswordInput
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="At least 6 characters"
          error={errors.newPassword}
        />
        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}