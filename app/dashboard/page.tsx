'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FlockMap } from '@/components/map/FlockMap';
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Search, 
  MessageCircle,
  Twitter,
  Globe,
  Home as HomeIcon,
  Users,
  X
} from 'lucide-react';
import { UnreadBadge } from '@/components/messaging/UnreadBadge';
import { getOrCreateConversation } from '@/lib/messaging/utils';

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
  grad_school: string | null;
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
  const [searchName, setSearchName] = useState<string>('');
  const [filterRoommates, setFilterRoommates] = useState<boolean>(false);
  
  // Status filters
  const [filterEmployed, setFilterEmployed] = useState<boolean>(false);
  const [filterInternship, setFilterInternship] = useState<boolean>(false);
  const [filterGradSchool, setFilterGradSchool] = useState<boolean>(false);
  const [filterLooking, setFilterLooking] = useState<boolean>(false);
  
  // Graduation year filter
  const [minGradYear, setMinGradYear] = useState<string>('');
  const [maxGradYear, setMaxGradYear] = useState<string>('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCity || selectedState) {
      loadFilteredUsers();
    } else if (currentUser) {
      // Load default classmates view
      loadFilteredUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSendMessage = async (userId: string) => {
    const conversationId = await getOrCreateConversation(userId);
    if (conversationId) {
      router.push(`/messages?conversation=${conversationId}`);
    }
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
    setSearchName('');
    setFilterRoommates(false);
    setFilterEmployed(false);
    setFilterInternship(false);
    setFilterGradSchool(false);
    setFilterLooking(false);
    setMinGradYear('');
    setMaxGradYear('');
  };

  // Apply client-side search filters
  const filteredUsers = users.filter(user => {
    // Name filter
    if (searchName && !user.full_name?.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }
    
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
    
    // Status filters - if any status filter is active, user must match at least one
    const hasStatusFilter = filterEmployed || filterInternship || filterGradSchool || filterLooking;
    if (hasStatusFilter) {
      const matchesStatus = 
        (filterEmployed && user.status === 'employed') ||
        (filterInternship && user.status === 'internship') ||
        (filterGradSchool && user.status === 'grad_school') ||
        (filterLooking && user.status === 'looking');
      
      if (!matchesStatus) {
        return false;
      }
    }
    
    // Graduation year filter
    if (minGradYear && user.grad_year < parseInt(minGradYear)) {
      return false;
    }
    if (maxGradYear && user.grad_year > parseInt(maxGradYear)) {
      return false;
    }
    
    // Roommate filter
    if (filterRoommates && !user.looking_for_roommate) {
      return false;
    }
    
    return true;
  });

  const hasActiveFilters = searchName || searchCity || searchJobTitle || searchCompany || 
    filterRoommates || filterEmployed || filterInternship || filterGradSchool || 
    filterLooking || minGradYear || maxGradYear;
  
  const activeFilterCount = [
    searchName, searchCity, searchJobTitle, searchCompany, filterRoommates,
    filterEmployed, filterInternship, filterGradSchool, filterLooking,
    minGradYear, maxGradYear
  ].filter(Boolean).length;

  // Calculate analytics from users data
  const analytics = React.useMemo(() => {
    // Only include users from the same institution
    const sameInstitutionUsers = users.filter(u => 
      currentUser?.institutions?.name && 
      u.institutions?.name === currentUser.institutions.name
    );

    // Top grad schools
    const gradSchoolCounts: { [key: string]: number } = {};
    sameInstitutionUsers.forEach(user => {
      if (user.status === 'grad_school' && user.grad_school) {
        gradSchoolCounts[user.grad_school] = (gradSchoolCounts[user.grad_school] || 0) + 1;
      }
    });
    const topGradSchools = Object.entries(gradSchoolCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([school, count]) => ({ name: school, count }));

    // Top cities
    const cityCounts: { [key: string]: number } = {};
    sameInstitutionUsers.forEach(user => {
      if (user.city && user.state) {
        const location = `${user.city}, ${user.state}`;
        cityCounts[location] = (cityCounts[location] || 0) + 1;
      }
    });
    const topCities = Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([city, count]) => ({ name: city, count }));

    // Top companies
    const companyCounts: { [key: string]: number } = {};
    sameInstitutionUsers.forEach(user => {
      if ((user.status === 'employed' || user.status === 'internship') && user.employer) {
        companyCounts[user.employer] = (companyCounts[user.employer] || 0) + 1;
      }
    });
    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([company, count]) => ({ name: company, count }));

    return {
      gradSchools: topGradSchools,
      cities: topCities,
      companies: topCompanies,
      totalClassmates: sameInstitutionUsers.length,
    };
  }, [users, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center px-4 relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        <div className="glass-strong rounded-3xl px-10 py-8 relative z-10 flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-rose-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white text-lg font-semibold drop-shadow">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-mesh overflow-hidden relative">
      {/* Floating background orbs - Ultra Dark */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      
      {/* Header */}
      <header className="glass-header shrink-0 z-20 sticky top-0">
        <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Flock</h1>
            {currentUser && (
              <span className="text-xs sm:text-sm text-white/80 hidden md:inline drop-shadow truncate">
                {currentUser.institutions?.name} • Class of {currentUser.grad_year}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Link 
              href="/messages"
              className="glass-light text-white hover:bg-white/20 text-xs sm:text-sm font-medium px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap relative"
            >
              <span className="hidden sm:inline">Messages</span>
              <MessageCircle className="w-4 h-4 sm:hidden" />
              <UnreadBadge />
            </Link>
            <Link 
              href="/profile/edit"
              className="glass-light text-white hover:bg-white/20 text-xs sm:text-sm font-medium px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="glass-light text-white hover:bg-white/20 text-xs sm:text-sm font-medium px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Map Section - Responsive Height with Glassmorphism Frame */}
      <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="glass-card p-2 sm:p-3 overflow-hidden">
          <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-xl overflow-hidden">
            <FlockMap onLocationSelect={handleLocationSelect} />
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Search & Filters - Enhanced */}
          <div className="glass-card p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white drop-shadow">Search & Filter</h3>
                  {hasActiveFilters && (
                    <p className="text-xs text-white/70 mt-0.5 drop-shadow flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-xs font-bold text-rose-400">
                        {activeFilterCount}
                      </span>
                      {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} • {filteredUsers.length} of {users.length} people
                    </p>
                  )}
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearSearch}
                  className="glass-button px-4 sm:px-5 py-2 text-xs sm:text-sm text-white font-semibold rounded-xl transition-all self-start sm:self-auto flex items-center gap-2 group"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  Clear all
                </button>
              )}
            </div>
            
            {/* Search Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Name Search */}
                <div>
                  <label htmlFor="search-name" className="block text-sm font-medium text-white/90 mb-1 drop-shadow">
                    Name
                  </label>
                  <input
                    type="text"
                    id="search-name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search by name"
                    className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                </div>

                {/* City Search */}
                <div>
                  <label htmlFor="search-city" className="block text-sm font-medium text-white/90 mb-1 drop-shadow">
                    City
                  </label>
                  <input
                    type="text"
                    id="search-city"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                </div>

                {/* Job Title Search */}
                <div>
                  <label htmlFor="search-job" className="block text-sm font-medium text-white/90 mb-1 drop-shadow">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="search-job"
                    value={searchJobTitle}
                    onChange={(e) => setSearchJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                </div>

                {/* Company Search */}
                <div>
                  <label htmlFor="search-company" className="block text-sm font-medium text-white/90 mb-1 drop-shadow">
                    Company
                  </label>
                  <input
                    type="text"
                    id="search-company"
                    value={searchCompany}
                    onChange={(e) => setSearchCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className="glass-input w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Status
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer glass-light px-3 py-2 rounded-lg hover:bg-white/20 transition-all">
                    <input
                      type="checkbox"
                      checked={filterEmployed}
                      onChange={(e) => setFilterEmployed(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/90 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      Employed
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer glass-light px-3 py-2 rounded-lg hover:bg-white/20 transition-all">
                    <input
                      type="checkbox"
                      checked={filterInternship}
                      onChange={(e) => setFilterInternship(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/90 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Internship
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer glass-light px-3 py-2 rounded-lg hover:bg-white/20 transition-all">
                    <input
                      type="checkbox"
                      checked={filterGradSchool}
                      onChange={(e) => setFilterGradSchool(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/90 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Grad School
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer glass-light px-3 py-2 rounded-lg hover:bg-white/20 transition-all">
                    <input
                      type="checkbox"
                      checked={filterLooking}
                      onChange={(e) => setFilterLooking(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/90 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" />
                      Looking
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer glass-light px-3 py-2 rounded-lg hover:bg-white/20 transition-all">
                    <input
                      type="checkbox"
                      checked={filterRoommates}
                      onChange={(e) => setFilterRoommates(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/90 flex items-center gap-1.5">
                      <HomeIcon className="w-3.5 h-3.5" />
                      Roommates
                    </span>
                  </label>
                </div>
              </div>

              {/* Graduation Year Range */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">
                  Graduation Year
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={minGradYear}
                    onChange={(e) => setMinGradYear(e.target.value)}
                    placeholder="From"
                    min="2000"
                    max="2030"
                    className="glass-input w-24 px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                  <span className="text-white/70">-</span>
                  <input
                    type="number"
                    value={maxGradYear}
                    onChange={(e) => setMaxGradYear(e.target.value)}
                    placeholder="To"
                    min="2000"
                    max="2030"
                    className="glass-input w-24 px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder-white/50"
                  />
                  {(minGradYear || maxGradYear) && (
                    <button
                      onClick={() => {
                        setMinGradYear('');
                        setMaxGradYear('');
                      }}
                      className="text-xs text-white/70 hover:text-white drop-shadow"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Info */}
          {(selectedCity || selectedState) && (
            <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white drop-shadow">
                  {selectedCity 
                    ? `Showing people in ${selectedCity}, ${selectedState}`
                    : `Showing people in ${selectedState}`
                  }
                </p>
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  {selectedCity 
                    ? 'All grads within 50 miles' 
                    : 'Classmates from your institution + people within 50 miles'
                  }
                </p>
              </div>
              <button
                onClick={handleClearFilter}
                className="glass-light px-4 py-2 text-sm text-white rounded-lg hover:bg-white/20 transition-all"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Users Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white drop-shadow">
                {selectedCity || selectedState ? 'People in this area' : 'Your Network'}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 drop-shadow">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
              </p>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="glass-card p-8 sm:p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 flex items-center justify-center">
                  <Search className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2 drop-shadow">No results found</h3>
                <p className="text-sm sm:text-base text-white/80 mb-4 max-w-md mx-auto drop-shadow px-4">
                  {hasActiveFilters 
                    ? 'No people match your search criteria. Try adjusting or clearing your filters.'
                    : selectedCity || selectedState 
                      ? 'No people found in this area. Try selecting a different location on the map.'
                      : 'No one in your network yet. The map shows where your classmates are located!'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearSearch}
                    className="glass-button px-4 py-2 text-white text-sm font-medium rounded-lg"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {filteredUsers.map((person) => (
                  <div
                    key={person.id}
                    className="group glass-card p-6 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden border border-white/5 hover:border-white/10"
                  >
                    {/* Animated gradient background on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-pink-500/0 to-rose-500/0 group-hover:from-rose-500/10 group-hover:via-pink-500/5 group-hover:to-rose-500/10 transition-all duration-500 pointer-events-none" />
                    
                    {/* Glow effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
                      </div>
                    
                    <div className="relative z-10">
                      {/* Header with Avatar and Name */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center ring-2 ring-white/10 group-hover:ring-rose-400/30 transition-all duration-300">
                            <span className="text-xl font-bold text-white">
                              {person.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {/* Status indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 ring-2 ring-[#0f0f23] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        </div>

                        {/* Name and School */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h4 className="font-bold text-white text-lg mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-300 group-hover:via-pink-300 group-hover:to-rose-300 transition-all duration-300">
                            {person.full_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-white/70 mb-0.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-400/80" />
                            <span className="truncate">{person.institutions?.name || 'University'}</span>
                          </div>
                          <p className="text-xs text-white/60">
                            Class of {person.grad_year}
                          </p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

                      {/* Status/Work Info - Fixed Height */}
                      <div className="mb-4 h-[72px] flex items-start">
                        {(person.status === 'employed' || person.status === 'internship') && (
                          <div className="flex items-start gap-2 w-full">
                            <Briefcase className="w-4 h-4 text-rose-400/80 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/90 font-medium leading-snug line-clamp-2">
                                {person.job_title || 'Working'}
                              </p>
                              {person.show_employer !== false && person.employer && (
                                <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                                  at {person.employer}
                                </p>
                              )}
                              {person.status === 'internship' && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-md">
                                  Internship
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {person.status === 'grad_school' && (
                          <div className="flex items-start gap-2 w-full">
                            <GraduationCap className="w-4 h-4 text-rose-400/80 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/90 font-medium leading-snug line-clamp-2">
                                {person.degree && `${person.degree} `}
                                {person.program || 'Graduate Student'}
                              </p>
                              {person.show_school !== false && person.grad_school && (
                                <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                                  at {person.grad_school}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {person.status === 'looking' && (
                          <div className="flex items-start gap-2 w-full">
                            <Search className="w-4 h-4 text-yellow-400/80 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-white/90 font-medium">
                              Looking for opportunities
                            </p>
                          </div>
                        )}
                        {!person.status && (
                          <div className="flex items-center justify-center w-full h-full text-white/40 text-xs">
                            No status set
                          </div>
                        )}
                      </div>

                      {/* Location - Fixed Height */}
                      <div className="h-[40px] mb-4 flex items-center">
                        {person.city && person.state ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 w-full">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400/80 flex-shrink-0" />
                            <span className="text-sm text-white/80 truncate">
                              {person.city}, {person.state}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-white/30 px-3">
                            Location not set
                          </div>
                        )}
                      </div>

                      {/* Badges - Fixed Height */}
                      <div className="h-[32px] mb-4 flex items-center">
                        {person.looking_for_roommate && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs glass-light text-white/90 rounded-lg font-medium border border-white/10">
                            <HomeIcon className="w-3 h-3" />
                            Looking for roommate
                          </span>
                        )}
                      </div>

                      {/* Contact Buttons */}
                      <button
                        onClick={() => handleSendMessage(person.id)}
                        className="group/btn w-full glass-button px-4 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/20 to-rose-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                        <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform relative z-10" />
                        <span className="relative z-10">Send Message</span>
                      </button>

                      {/* Social Links */}
                      {(person.twitter_url || person.personal_website) && (
                        <div className="flex gap-2 mt-3">{person.twitter_url && (
                            <a
                              href={person.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 glass-light p-2.5 rounded-lg text-white/60 hover:text-sky-400 hover:bg-sky-500/10 transition-all hover:scale-105 flex items-center justify-center group/social"
                              title="Twitter"
                            >
                              <Twitter className="w-4 h-4 group-hover/social:scale-110 transition-transform" />
                            </a>
                          )}
                          {person.personal_website && (
                            <a
                              href={person.personal_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 glass-light p-2.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all hover:scale-105 flex items-center justify-center group/social"
                              title="Website"
                            >
                              <Globe className="w-4 h-4 group-hover/social:scale-110 transition-transform" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network Insights - Bottom Section - EPIC REDESIGN */}
          {analytics.totalClassmates > 0 && (
            <div className="mt-16 sm:mt-24 relative">
              {/* Background glow effect */}
              <div className="absolute inset-0 -top-20 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 rounded-full blur-3xl" />
              </div>

              {/* Section Header - More Dramatic */}
              <div className="text-center mb-12 sm:mb-16 relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                  Your{' '}
                  <span className="relative inline-block">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 animate-gradient">
                      {currentUser?.institutions?.name}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                      <path d="M0 4C50 0 150 8 200 4" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0">
                          <stop stopColor="#F28B82" />
                          <stop offset="0.5" stopColor="#EC4899" />
                          <stop offset="1" stopColor="#F9C5D1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                  {' '}Network
                </h2>
                <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
                  Real-time insights from {analytics.totalClassmates} alumni building their futures
                </p>
              </div>

              {/* Hero Stats - Bento Grid Style */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 relative z-10">
                {/* Main stat - Total Network */}
                <div className="col-span-2 glass-card p-6 sm:p-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-rose-500/20">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-bl-full" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-tr-full" />
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 flex items-center justify-center ring-2 ring-rose-400/30 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-10 h-10 text-rose-400" />
                    </div>
                    <div>
                      <div className="text-5xl sm:text-6xl font-bold text-white mb-1 tracking-tight">
                        {analytics.totalClassmates}
                      </div>
                      <div className="text-sm sm:text-base text-white/70 font-medium">Alumni in Your Network</div>
                    </div>
                  </div>
                </div>

                {/* Cities stat */}
                <div className="glass-card p-5 sm:p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300 border border-cyan-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                  <div className="relative z-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <MapPin className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{analytics.cities.length}</div>
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider">Cities</div>
                  </div>
                </div>

                {/* Companies stat */}
                <div className="glass-card p-5 sm:p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300 border border-emerald-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                  <div className="relative z-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                      <Briefcase className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{analytics.companies.length}</div>
                    <div className="text-xs text-white/60 font-medium uppercase tracking-wider">Companies</div>
                  </div>
                </div>
              </div>

              {/* Visual Bubbles for Top Destinations */}
              <div className="mb-12 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                    </span>
                    Top Destinations
                  </h3>
                  <span className="text-sm text-white/50">{analytics.cities.length} cities worldwide</span>
                </div>
                
                {analytics.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {analytics.cities.slice(0, 12).map((city, idx) => {
                      const sizes = ['text-lg px-5 py-2.5', 'text-base px-4 py-2', 'text-sm px-3.5 py-1.5', 'text-xs px-3 py-1.5'];
                      const sizeClass = sizes[Math.min(Math.floor(idx / 3), 3)];
                      const opacity = Math.max(0.4, 1 - (idx * 0.06));
                      
                      return (
                        <button
                          key={city.name}
                          onClick={() => {
                            const parts = city.name.split(', ');
                            if (parts.length === 2) {
                              setSelectedCity(parts[0]);
                              setSelectedState(parts[1]);
                            }
                          }}
                          className={`${sizeClass} glass-card font-medium text-white border border-white/10 rounded-full hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:scale-105 transition-all duration-300 group flex items-center gap-2`}
                          style={{ opacity }}
                        >
                          <span className="group-hover:text-cyan-300 transition-colors">{city.name}</span>
                          <span className="text-white/40 group-hover:text-cyan-400/60 font-bold">{city.count}</span>
                        </button>
                      );
                    })}
                    {analytics.cities.length > 12 && (
                      <span className="text-sm text-white/40 flex items-center px-3">
                        +{analytics.cities.length - 12} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Companies & Grad Schools Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* Top Companies - Card with Visual Ranking */}
                <div className="glass-card p-6 sm:p-8 relative overflow-hidden group border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center ring-2 ring-emerald-400/20">
                      <Briefcase className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">Where Alumni Work</h3>
                      <p className="text-sm text-white/50">{analytics.companies.length} companies represented</p>
                    </div>
                  </div>

                  {analytics.companies.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.companies.slice(0, 6).map((company, idx) => {
                        const percentage = (company.count / analytics.companies[0].count) * 100;
                        const medals = ['🥇', '🥈', '🥉'];
                        
                        return (
                          <div key={company.name} className="group/item">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg w-8 text-center">
                                {idx < 3 ? medals[idx] : <span className="text-white/30 text-sm font-bold">#{idx + 1}</span>}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white truncate group-hover/item:text-emerald-300 transition-colors">
                                    {company.name}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-400 tabular-nums">{company.count}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-11 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40">No company data yet</p>
                    </div>
                  )}
                </div>

                {/* Grad Schools - Card with Visual Ranking */}
                <div className="glass-card p-6 sm:p-8 relative overflow-hidden group border border-violet-500/10 hover:border-violet-500/30 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-violet-400/20">
                      <GraduationCap className="w-7 h-7 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">Graduate Studies</h3>
                      <p className="text-sm text-white/50">{analytics.gradSchools.length} grad schools</p>
                    </div>
                  </div>

                  {analytics.gradSchools.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.gradSchools.slice(0, 6).map((school, idx) => {
                        const percentage = (school.count / analytics.gradSchools[0].count) * 100;
                        const medals = ['🥇', '🥈', '🥉'];
                        
                        return (
                          <div key={school.name} className="group/item">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg w-8 text-center">
                                {idx < 3 ? medals[idx] : <span className="text-white/30 text-sm font-bold">#{idx + 1}</span>}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white truncate group-hover/item:text-violet-300 transition-colors">
                                    {school.name}
                                  </span>
                                  <span className="text-sm font-bold text-violet-400 tabular-nums">{school.count}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-11 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40">No grad school data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="mt-12 text-center relative z-10">
                <div className="inline-flex items-center gap-2 text-white/40 text-sm">
                  <span className="w-12 h-px bg-gradient-to-r from-transparent to-white/20"></span>
                  <span>Data updates in real-time as alumni join</span>
                  <span className="w-12 h-px bg-gradient-to-l from-transparent to-white/20"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
