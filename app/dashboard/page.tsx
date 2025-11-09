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
  Filter,
  Mail,
  Linkedin,
  Twitter,
  Globe,
  Home as HomeIcon,
  Building2,
  TrendingUp,
  Users,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

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

  // Analytics state
  const [expandedGradSchools, setExpandedGradSchools] = useState(false);
  const [expandedCities, setExpandedCities] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState(false);

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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
        
        <div className="glass-strong rounded-3xl px-10 py-8 relative z-10 flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24">
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
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-lighten filter blur-3xl animate-pulse animation-delay-2000"></div>
      
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

      {/* Analytics Section */}
      {analytics.totalClassmates > 0 && (
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">
              Network Insights
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mb-4 sm:mb-6 drop-shadow">
              Where your {currentUser?.institutions?.name || 'university'} classmates are heading
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Top Cities */}
              <div className="glass-card p-5 sm:p-6 group hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white text-base">Top Cities</h3>
                  </div>
                  <span className="text-xs glass-light text-white/90 px-2.5 py-1 rounded-full font-medium">
                    {analytics.cities.length}
                  </span>
                </div>

                {analytics.cities.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {analytics.cities.slice(0, expandedCities ? undefined : 5).map((city, idx) => (
                        <div key={city.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-xs font-medium text-white/50 w-4 drop-shadow">#{idx + 1}</span>
                            <span className="text-sm text-white truncate drop-shadow">{city.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                style={{ width: `${(city.count / analytics.cities[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-white w-6 text-right drop-shadow">
                              {city.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {analytics.cities.length > 5 && (
                      <button
                        onClick={() => setExpandedCities(!expandedCities)}
                        className="mt-4 text-sm text-white hover:text-white/80 font-medium drop-shadow"
                      >
                        {expandedCities ? '− Show less' : `+ Show ${analytics.cities.length - 5} more`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/70 drop-shadow">No location data yet</p>
                )}
              </div>

              {/* Top Companies */}
              <div className="glass-card p-5 sm:p-6 group hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-white text-base">Top Companies</h3>
                  </div>
                  <span className="text-xs glass-light text-white/90 px-2.5 py-1 rounded-full font-medium">
                    {analytics.companies.length}
                  </span>
                </div>

                {analytics.companies.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {analytics.companies.slice(0, expandedCompanies ? undefined : 5).map((company, idx) => (
                        <div key={company.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-xs font-medium text-white/50 w-4 drop-shadow">#{idx + 1}</span>
                            <span className="text-sm text-white truncate drop-shadow">{company.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                style={{ width: `${(company.count / analytics.companies[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-white w-6 text-right drop-shadow">
                              {company.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {analytics.companies.length > 5 && (
                      <button
                        onClick={() => setExpandedCompanies(!expandedCompanies)}
                        className="mt-4 text-sm text-white hover:text-white/80 font-medium drop-shadow"
                      >
                        {expandedCompanies ? '− Show less' : `+ Show ${analytics.companies.length - 5} more`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/70 drop-shadow">No company data yet</p>
                )}
              </div>

              {/* Top Grad Schools */}
              <div className="glass-card p-5 sm:p-6 group hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white text-base">Top Grad Schools</h3>
                  </div>
                  <span className="text-xs glass-light text-white/90 px-2.5 py-1 rounded-full font-medium">
                    {analytics.gradSchools.length}
                  </span>
                </div>

                {analytics.gradSchools.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {analytics.gradSchools.slice(0, expandedGradSchools ? undefined : 5).map((school, idx) => (
                        <div key={school.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-xs font-medium text-white/50 w-4 drop-shadow">#{idx + 1}</span>
                            <span className="text-sm text-white truncate drop-shadow">{school.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                style={{ width: `${(school.count / analytics.gradSchools[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-white w-6 text-right drop-shadow">
                              {school.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {analytics.gradSchools.length > 5 && (
                      <button
                        onClick={() => setExpandedGradSchools(!expandedGradSchools)}
                        className="mt-4 text-sm text-white hover:text-white/80 font-medium drop-shadow"
                      >
                        {expandedGradSchools ? '− Show less' : `+ Show ${analytics.gradSchools.length - 5} more`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/70 drop-shadow">No grad school data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Section - Below Analytics */}
      <div className="flex-1 overflow-auto relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Search & Filters - Enhanced */}
          <div className="glass-card p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white drop-shadow">Search & Filter</h3>
                  {hasActiveFilters && (
                    <p className="text-xs text-white/70 mt-0.5 drop-shadow flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
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

          {/* Current User Card - Enhanced */}
          <div className="glass-card p-6 sm:p-7 md:p-8 mb-6 sm:mb-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 relative z-10">
              <div className="flex-1 min-w-0 pr-32 sm:pr-0">
                {/* Profile badge - moved inside content area */}
                <div className="inline-flex items-center gap-1.5 glass-light px-3 py-1.5 rounded-full mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-medium text-white/90 drop-shadow">Your Profile</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow mb-2">{currentUser?.full_name}</h2>
                <div className="flex flex-col gap-2 text-sm sm:text-base text-white/80">
                  <p className="flex items-center gap-2 drop-shadow">
                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                    </svg>
                    <span>{currentUser?.institutions?.name || 'No institution'} • Class of {currentUser?.grad_year}</span>
                  </p>
                <div className="mt-2">
                  {(currentUser?.status === 'employed' || currentUser?.status === 'internship') && (
                    <p className="text-sm text-white/90 drop-shadow">
                      {currentUser.job_title && `${currentUser.job_title}`}
                      {currentUser.show_employer !== false && currentUser.employer && ` at ${currentUser.employer}`}
                      {!currentUser.job_title && currentUser.show_employer !== false && currentUser.employer}
                      {currentUser.status === 'internship' && ' (Internship)'}
                    </p>
                  )}
                  {currentUser?.status === 'grad_school' && currentUser.program && (
                    <p className="text-sm text-white/90 drop-shadow">
                      {currentUser.degree} in {currentUser.program}
                      {currentUser.show_school !== false && currentUser.grad_school && ` at ${currentUser.grad_school}`}
                    </p>
                  )}
                  {currentUser?.status === 'looking' && (
                    <p className="text-sm text-white/90 drop-shadow">
                      Looking for opportunities
                    </p>
                  )}
                </div>
                  {currentUser?.city && currentUser?.state && (
                    <p className="text-sm text-white/80 mt-2 drop-shadow flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      {currentUser.city}, {currentUser.state}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="glass-button px-5 sm:px-6 py-2.5 text-xs sm:text-sm text-white rounded-xl font-semibold transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-2 group"
              >
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                Edit Profile
              </Link>
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
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
                    className="group glass-card p-5 sm:p-6 hover:scale-[1.03] transition-all duration-500 relative overflow-hidden"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
                    }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white drop-shadow text-sm sm:text-base truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
                            {person.full_name}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/80 mt-1 drop-shadow flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                            </svg>
                            <span className="truncate">{person.institutions?.name || 'University'}</span>
                          </p>
                          <p className="text-xs text-white/70 mt-0.5 drop-shadow flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Class of {person.grad_year}
                          </p>
                        </div>
                      </div>
                    
                    <div className="mt-3">
                      {(person.status === 'employed' || person.status === 'internship') && (
                        <p className="text-sm text-white/90 drop-shadow">
                          {person.job_title && `${person.job_title}`}
                          {person.show_employer !== false && person.employer && ` at ${person.employer}`}
                          {!person.job_title && person.show_employer !== false && person.employer}
                          {person.status === 'internship' && ' (Internship)'}
                        </p>
                      )}
                      {person.status === 'grad_school' && person.program && (
                        <p className="text-sm text-white/90 drop-shadow">
                          {person.degree && `${person.degree} in `}
                          {person.program}
                          {person.show_school !== false && person.grad_school && ` at ${person.grad_school}`}
                        </p>
                      )}
                      {person.status === 'looking' && (
                        <p className="text-sm text-white/90 drop-shadow">
                          Looking for opportunities
                        </p>
                      )}
                    </div>

                    {person.city && person.state && (
                      <p className="text-sm text-white/70 mt-2 drop-shadow flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {person.city}, {person.state}
                      </p>
                    )}

                    {person.looking_for_roommate && (
                      <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs glass-light text-white/90 rounded-lg font-medium">
                        <HomeIcon className="w-3.5 h-3.5" />
                        Looking for roommate
                      </span>
                    )}

                      {/* Contact Button */}
                      <a
                        href={`mailto:${person.email}?subject=Hi from Flock - ${currentUser?.institutions?.name || 'Alumni'}&body=Hi ${person.full_name.split(' ')[0]},%0D%0A%0D%0AI found you on Flock and wanted to reach out!%0D%0A%0D%0A- ${currentUser?.full_name}`}
                        className="glass-button mt-5 w-full px-4 py-3 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 group-hover:shadow-lg transition-all"
                      >
                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Send Email
                      </a>

                      {/* Social links */}
                      {(person.linkedin_url || person.twitter_url || person.personal_website) && (
                        <div className="mt-4 flex gap-2">
                          {person.linkedin_url && (
                            <a
                              href={person.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 glass-light p-2.5 rounded-xl text-white/70 hover:text-blue-400 hover:bg-blue-500/10 transition-all hover:scale-105 flex items-center justify-center"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                          {person.twitter_url && (
                            <a
                              href={person.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 glass-light p-2.5 rounded-xl text-white/70 hover:text-sky-400 hover:bg-sky-500/10 transition-all hover:scale-105 flex items-center justify-center"
                              title="Twitter"
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          {person.personal_website && (
                            <a
                              href={person.personal_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 glass-light p-2.5 rounded-xl text-white/70 hover:text-purple-400 hover:bg-purple-500/10 transition-all hover:scale-105 flex items-center justify-center"
                              title="Website"
                            >
                              <Globe className="w-4 h-4" />
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
        </div>
      </div>
    </div>
  );
}
