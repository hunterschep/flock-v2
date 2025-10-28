'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FlockMap } from '@/components/map/FlockMap';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  grad_year: number;
  city: string | null;
  state: string | null;
  status: string | null;
  employer: string | null;
  job_title: string | null;
  program: string | null;
  degree: string | null;
  show_employer: boolean;
  show_school: boolean;
  looking_for_roommate: boolean;
  linkedin_url: string | null;
  twitter_url: string | null;
  personal_website: string | null;
  institutions: {
    name: string;
    domain: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Search filters
  const [searchCity, setSearchCity] = useState<string>('');
  const [searchJobTitle, setSearchJobTitle] = useState<string>('');
  const [searchCompany, setSearchCompany] = useState<string>('');
  const [filterRoommates, setFilterRoommates] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCity || selectedState) {
      loadFilteredUsers();
    } else if (currentUser) {
      // Load default classmates view
      loadFilteredUsers();
    }
  }, [selectedCity, selectedState, currentUser]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Get current user's profile
      const { data: profile } = await supabase
        .from('users')
        .select(`
          *,
          institutions:institution_id (
            name,
            domain
          )
        `)
        .eq('id', user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        router.push('/onboarding');
        return;
      }

      setCurrentUser(profile as UserProfile);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('users')
        .select(`
          *,
          institutions:institution_id (
            name,
            domain
          )
        `)
        .neq('id', user.id)
        .eq('profile_visible', true)
        .eq('onboarding_completed', true);

      // Filter by state or city if selected
      if (selectedState) {
        query = query.eq('state', selectedState);
      }

      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      setUsers((data as UserProfile[]) || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleLocationSelect = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
  };

  const handleClearFilter = () => {
    setSelectedCity('');
    setSelectedState('');
  };

  const handleClearSearch = () => {
    setSearchCity('');
    setSearchJobTitle('');
    setSearchCompany('');
    setFilterRoommates(false);
  };

  // Apply client-side search filters
  const filteredUsers = users.filter(user => {
    // City filter
    if (searchCity && !user.city?.toLowerCase().includes(searchCity.toLowerCase())) {
      return false;
    }
    
    // Job title filter
    if (searchJobTitle && !user.job_title?.toLowerCase().includes(searchJobTitle.toLowerCase())) {
      return false;
    }
    
    // Company filter
    if (searchCompany && !user.employer?.toLowerCase().includes(searchCompany.toLowerCase())) {
      return false;
    }
    
    // Roommate filter
    if (filterRoommates && !user.looking_for_roommate) {
      return false;
    }
    
    return true;
  });

  const hasActiveFilters = searchCity || searchJobTitle || searchCompany || filterRoommates;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b shrink-0 z-20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Flock</h1>
            {currentUser && (
              <span className="text-sm text-gray-600 hidden sm:inline">
                {currentUser.institutions?.name} • Class of {currentUser.grad_year}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/profile/edit"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Map Section - Fixed Height */}
      <div className="w-full h-[600px] relative">
        <FlockMap onLocationSelect={handleLocationSelect} />
      </div>

      {/* List Section - Below Map */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City Search */}
              <div>
                <label htmlFor="search-city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="search-city"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Job Title Search */}
              <div>
                <label htmlFor="search-job" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  id="search-job"
                  value={searchJobTitle}
                  onChange={(e) => setSearchJobTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Company Search */}
              <div>
                <label htmlFor="search-company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="search-company"
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Roommate Filter */}
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={filterRoommates}
                    onChange={(e) => setFilterRoommates(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Looking for roommates only
                  </span>
                </label>
              </div>
            </div>

            {/* Active filters count */}
            {hasActiveFilters && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} people
              </div>
            )}
          </div>

          {/* Current User Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentUser?.full_name}</h2>
                <p className="text-gray-600 mt-1">
                  {currentUser?.institutions?.name || 'No institution'} • Class of {currentUser?.grad_year}
                </p>
                <div className="mt-2">
                  {currentUser?.status === 'employed' && (
                    <p className="text-sm text-gray-700">
                      {currentUser.job_title && `${currentUser.job_title}`}
                      {currentUser.show_employer !== false && currentUser.employer && ` at ${currentUser.employer}`}
                      {!currentUser.job_title && currentUser.show_employer !== false && currentUser.employer}
                    </p>
                  )}
                  {currentUser?.status === 'grad_school' && currentUser.program && (
                    <p className="text-sm text-gray-700">
                      {currentUser.degree} in {currentUser.program}
                      {currentUser.show_school !== false && currentUser.institutions?.name && ` at ${currentUser.institutions.name}`}
                    </p>
                  )}
                  {currentUser?.status === 'looking' && (
                    <p className="text-sm text-gray-700">
                      Looking for opportunities
                    </p>
                  )}
                </div>
                {currentUser?.city && currentUser?.state && (
                  <p className="text-sm text-gray-500 mt-2">
                    📍 {currentUser.city}, {currentUser.state}
                  </p>
                )}
              </div>
              <Link
                href="/profile/edit"
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Filter Info */}
          {(selectedCity || selectedState) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedCity 
                    ? `Showing people in ${selectedCity}, ${selectedState}`
                    : `Showing people in ${selectedState}`
                  }
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {selectedCity 
                    ? 'All grads within 50 miles' 
                    : 'Classmates from your institution + people within 50 miles'
                  }
                </p>
              </div>
              <button
                onClick={handleClearFilter}
                className="px-4 py-2 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Users Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCity || selectedState ? 'People in this area' : 'Your Network'}
              </h3>
              <p className="text-sm text-gray-500">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
              </p>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">
                  {hasActiveFilters 
                    ? 'No people match your search criteria. Try adjusting your filters.'
                    : selectedCity || selectedState 
                      ? 'No people found in this area. Try selecting a different location on the map.'
                      : 'No one in your network yet. The map shows where your classmates are located!'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearSearch}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((person) => (
                  <div
                    key={person.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{person.full_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {person.institutions?.name || 'University'} • Class of {person.grad_year}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      {person.status === 'employed' && (
                        <p className="text-sm text-gray-700">
                          {person.job_title && `${person.job_title}`}
                          {person.show_employer !== false && person.employer && ` at ${person.employer}`}
                          {!person.job_title && person.show_employer !== false && person.employer}
                        </p>
                      )}
                      {person.status === 'grad_school' && person.program && (
                        <p className="text-sm text-gray-700">
                          {person.degree && `${person.degree} in `}
                          {person.program}
                          {person.show_school !== false && person.institutions?.name && ` at ${person.institutions.name}`}
                        </p>
                      )}
                      {person.status === 'looking' && (
                        <p className="text-sm text-gray-700">
                          Looking for opportunities
                        </p>
                      )}
                    </div>

                    {person.city && person.state && (
                      <p className="text-sm text-gray-500 mt-2">
                        📍 {person.city}, {person.state}
                      </p>
                    )}

                    {person.looking_for_roommate && (
                      <span className="inline-block mt-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Looking for roommate
                      </span>
                    )}

                    {/* Contact Button */}
                    <a
                      href={`mailto:${person.email}?subject=Hi from Flock - ${currentUser?.institutions?.name || 'Alumni'}&body=Hi ${person.full_name.split(' ')[0]},%0D%0A%0D%0AI found you on Flock and wanted to reach out!%0D%0A%0D%0A- ${currentUser?.full_name}`}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Email
                    </a>

                    {/* Social links */}
                    {(person.linkedin_url || person.twitter_url || person.personal_website) && (
                      <div className="mt-4 flex space-x-3">
                        {person.linkedin_url && (
                          <a
                            href={person.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <span className="sr-only">LinkedIn</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                            </svg>
                          </a>
                        )}
                        {person.twitter_url && (
                          <a
                            href={person.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <span className="sr-only">Twitter</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                          </a>
                        )}
                        {person.personal_website && (
                          <a
                            href={person.personal_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <span className="sr-only">Website</span>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
