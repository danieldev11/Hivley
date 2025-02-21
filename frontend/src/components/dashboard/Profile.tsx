import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, Phone, MapPin, Clock, Globe, Briefcase, Award, Calendar, Camera, Check, X } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  qualifications: string[];
  businessHours: {
    [key: string]: {
      start: string;
      end: string;
      closed: boolean;
    };
  };
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  profileImage?: string;
}

const defaultBusinessHours = {
  monday: { start: '09:00', end: '17:00', closed: false },
  tuesday: { start: '09:00', end: '17:00', closed: false },
  wednesday: { start: '09:00', end: '17:00', closed: false },
  thursday: { start: '09:00', end: '17:00', closed: false },
  friday: { start: '09:00', end: '17:00', closed: false },
  saturday: { start: '10:00', end: '15:00', closed: true },
  sunday: { start: '10:00', end: '15:00', closed: true },
};

export const Profile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    qualifications: [],
    businessHours: defaultBusinessHours,
    socialLinks: {},
  });
  const [editedData, setEditedData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    qualifications: [],
    businessHours: defaultBusinessHours,
    socialLinks: {},
  });
  const [newQualification, setNewQualification] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: metadata, error: metadataError } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('id', user.id)
        .single();

      if (metadataError) throw metadataError;

      const newProfileData = {
        fullName: profile.full_name,
        email: user.email ?? '',
        phone: metadata.preferences?.phone ?? '',
        address: metadata.preferences?.address ?? '',
        bio: metadata.preferences?.bio ?? '',
        qualifications: metadata.preferences?.qualifications ?? [],
        businessHours: metadata.preferences?.businessHours ?? defaultBusinessHours,
        socialLinks: metadata.preferences?.socialLinks ?? {},
        profileImage: metadata.preferences?.profileImage,
      };

      setProfileData(newProfileData);
      setEditedData(newProfileData);
      
      if (newProfileData.profileImage) {
        setImagePreview(newProfileData.profileImage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profileData);
    setError(null);
    setSuccessMessage(null);
    setImagePreview(profileData.profileImage || null);
    setImageFile(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      let profileImageUrl = profileData.profileImage;

      // Upload new image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        profileImageUrl = publicUrl;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: editedData.fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update metadata
      const { error: metadataError } = await supabase
        .from('user_metadata')
        .update({
          preferences: {
            phone: editedData.phone,
            address: editedData.address,
            bio: editedData.bio,
            qualifications: editedData.qualifications,
            businessHours: editedData.businessHours,
            socialLinks: editedData.socialLinks,
            profileImage: profileImageUrl,
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (metadataError) throw metadataError;

      setProfileData({
        ...editedData,
        profileImage: profileImageUrl,
      });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setEditedData({
        ...editedData,
        qualifications: [...editedData.qualifications, newQualification.trim()]
      });
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setEditedData({
      ...editedData,
      qualifications: editedData.qualifications.filter((_, i) => i !== index)
    });
  };

  const updateBusinessHours = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    setEditedData({
      ...editedData,
      businessHours: {
        ...editedData.businessHours,
        [day]: {
          ...editedData.businessHours[day],
          [field]: value
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {imagePreview || profileData.profileImage ? (
                <img
                  src={imagePreview || profileData.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserCircle className="w-16 h-16 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <label
                  htmlFor="profile-image"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    id="profile-image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            {isEditing && (
              <p className="text-sm text-gray-500">
                Recommended: 400x400px, Max 5MB
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Full Name
                </div>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.fullName}
                  onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              ) : (
                <p className="text-gray-900">{profileData.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </div>
              </label>
              <p className="text-gray-900">{profileData.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </div>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedData.phone}
                  onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </div>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.address}
                  onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              ) : (
                <p className="text-gray-900">{profileData.address || 'Not provided'}</p>
              )}
            </div>
          </div>

          {/* Business Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={editedData.bio}
                onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Tell us about yourself (150-250 words)"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {profileData.bio || 'No bio provided'}
              </p>
            )}
          </div>

          {/* Qualifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Qualifications & Certifications
              </div>
            </label>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Add a qualification"
                  />
                  <button
                    onClick={addQualification}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedData.qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full"
                    >
                      <span>{qual}</span>
                      <button
                        onClick={() => removeQualification(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.qualifications.map((qual, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {qual}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Business Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Business Hours
              </div>
            </label>
            <div className="space-y-4">
              {Object.entries(editedData.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </span>
                  </div>
                  {isEditing ? (
                    <>
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg"
                        disabled={hours.closed}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded-lg"
                        disabled={hours.closed}
                      />
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-600">Closed</span>
                      </label>
                    </>
                  ) : (
                    <span className="text-gray-600">
                      {hours.closed ? (
                        'Closed'
                      ) : (
                        `${format(new Date(`2000-01-01T${hours.start}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${hours.end}`), 'h:mm a')}`
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Professional Links
              </div>
            </label>
            <div className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Website</label>
                    <input
                      type="url"
                      value={editedData.socialLinks.website || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        socialLinks: { ...editedData.socialLinks, website: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border -gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={editedData.socialLinks.linkedin || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        socialLinks: { ...editedData.socialLinks, linkedin: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Twitter</label>
                    <input
                      type="url"
                      value={editedData.socialLinks.twitter || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        socialLinks: { ...editedData.socialLinks, twitter: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Instagram</label>
                    <input
                      type="url"
                      value={editedData.socialLinks.instagram || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        socialLinks: { ...editedData.socialLinks, instagram: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-primary hover:text-primary/80"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};