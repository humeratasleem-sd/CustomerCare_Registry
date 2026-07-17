import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Camera, User, Phone, MapPin, Building, Lock } from 'lucide-react';
import axios from 'axios';
import { updateProfile, uploadAvatar } from '../redux/slices/authSlice';
import { SOCKET_URL, API_URL } from '../constants';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading } = useSelector((state) => state.auth);
  
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const { register: registerPass, handleSubmit: handleSubmitPass, reset: resetPass, watch, formState: { errors: passErrors } } = useForm();
  const newPassword = watch('newPassword');

  // Load defaults
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.profileDetails?.phone || '',
        address: user.profileDetails?.address || '',
        companyName: user.profileDetails?.companyName || ''
      });
    }
  }, [user, reset]);

  const onUpdateProfile = (data) => {
    dispatch(updateProfile(data))
      .unwrap()
      .then(() => toast.success('Profile details updated successfully.'))
      .catch((err) => toast.error(err));
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUploading(true);
    dispatch(uploadAvatar(file))
      .unwrap()
      .then(() => {
        toast.success('Profile photo uploaded.');
        setPhotoUploading(false);
      })
      .catch((err) => {
        toast.error(err);
        setPhotoUploading(false);
      });
  };

  // Change password manually
  const onChangePassword = async (data) => {
    setPassLoading(true);
    try {
      await axios.put(`${API_URL}/auth/profile`, { 
        password: data.newPassword 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed successfully.');
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure profile details and credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-fit text-center space-y-6 shadow-sm">
          <div className="relative w-28 h-28 mx-auto group">
            {user?.profilePicture ? (
              <img
                src={`${SOCKET_URL}${user.profilePicture}`}
                alt="profile"
                className="w-full h-full rounded-full object-cover border-2 border-primary-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }}
              />
            ) : (
              <div className="w-full h-full bg-primary-100 text-primary-750 dark:bg-primary-950 dark:text-primary-350 rounded-full flex items-center justify-center font-bold text-2xl uppercase">
                {user?.name?.slice(0, 2)}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white cursor-pointer hover:bg-primary-700 shadow-md group-hover:scale-105 active:scale-95 transition-all">
              <Camera size={14} />
              <input type="file" onChange={onFileChange} className="hidden" accept="image/*" />
            </label>
          </div>

          <div>
            <h2 className="text-lg font-bold">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{user?.role}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex justify-around text-xs">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-350">Status</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900 rounded-full text-[10px] uppercase font-bold">Active</span>
            </div>
            {user?.role === 'Customer' && (
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-350">Tickets Raised</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white text-base">{user.profileDetails?.complaintCount || 0}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <User size={16} className="text-primary-500" /> General Profile Information
            </h3>

            <form onSubmit={handleSubmit(onUpdateProfile)} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  className="w-full px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Contact Phone</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium"
                />
              </div>

              {user?.role === 'Customer' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      {...register('companyName')}
                      className="w-full px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Location Address</label>
                    <textarea
                      rows={2}
                      {...register('address')}
                      className="w-full px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium resize-none"
                    ></textarea>
                  </div>
                </>
              )}

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Lock size={16} className="text-primary-500" /> Credentials Security
            </h3>

            <form onSubmit={handleSubmitPass(onChangePassword)} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  {...registerPass('newPassword', { 
                    required: 'Password is required', 
                    minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                  })}
                  className={`w-full px-4.5 py-2.5 rounded-xl border bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium ${passErrors.newPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {passErrors.newPassword && (
                  <span className="text-[10px] text-rose-500 mt-1 block">{passErrors.newPassword.message}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  {...registerPass('confirmNewPassword', { 
                    required: 'Confirm password is required',
                    validate: (val) => val === newPassword || 'Passwords do not match'
                  })}
                  className={`w-full px-4.5 py-2.5 rounded-xl border bg-transparent text-xs outline-none focus:border-primary-500 transition-all font-medium ${passErrors.confirmNewPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
                {passErrors.confirmNewPassword && (
                  <span className="text-[10px] text-rose-500 mt-1 block">{passErrors.confirmNewPassword.message}</span>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
