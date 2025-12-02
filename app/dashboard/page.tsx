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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UnreadBadge } from '@/components/messaging/UnreadBadge';
import { getOrCreateConversation } from '@/lib/messaging/utils';
import { Footer } from '@/components/Footer';

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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchCity, searchJobTitle, searchCompany, filterRoommates, 
      filterEmployed, filterInternship, filterGradSchool, filterLooking, 
      minGradYear, maxGradYear, selectedCity, selectedState]);

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
    <div id="main-content" className="min-h-screen flex flex-col gradient-mesh overflow-hidden relative">
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
          {/* Search & Filters - Clean Compact Design */}
          <div className="glass-card p-4 sm:p-5 mb-6 border border-white/5">
            {/* Single Row: Search + Quick Filters + Clear */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search Input with Icon */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search by name..."
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/40"
                />
              </div>
              
              {/* Quick Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterEmployed(!filterEmployed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    filterEmployed 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'glass-light text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Briefcase className="w-3 h-3" />
                  Employed
                </button>
                <button
                  onClick={() => setFilterGradSchool(!filterGradSchool)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    filterGradSchool 
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                      : 'glass-light text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  Grad School
                </button>
                <button
                  onClick={() => setFilterLooking(!filterLooking)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    filterLooking 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'glass-light text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Search className="w-3 h-3" />
                  Looking
                </button>
                <button
                  onClick={() => setFilterRoommates(!filterRoommates)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    filterRoommates 
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                      : 'glass-light text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <HomeIcon className="w-3 h-3" />
                  Roommates
                </button>
              </div>

              {/* Clear & Count */}
              {hasActiveFilters && (
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-white/50">
                    {filteredUsers.length} of {users.length}
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Expandable Advanced Filters */}
            <details className="mt-3 group">
              <summary className="text-xs text-white/50 hover:text-white/70 cursor-pointer list-none flex items-center gap-1 transition-colors">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                More filters
              </summary>
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="City"
                  className="glass-input px-3 py-2 rounded-lg text-sm text-white placeholder-white/40"
                />
                <input
                  type="text"
                  value={searchJobTitle}
                  onChange={(e) => setSearchJobTitle(e.target.value)}
                  placeholder="Job Title"
                  className="glass-input px-3 py-2 rounded-lg text-sm text-white placeholder-white/40"
                />
                <input
                  type="text"
                  value={searchCompany}
                  onChange={(e) => setSearchCompany(e.target.value)}
                  placeholder="Company"
                  className="glass-input px-3 py-2 rounded-lg text-sm text-white placeholder-white/40"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minGradYear}
                    onChange={(e) => setMinGradYear(e.target.value)}
                    placeholder="Year from"
                    className="glass-input flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40"
                  />
                  <span className="text-white/30">-</span>
                  <input
                    type="number"
                    value={maxGradYear}
                    onChange={(e) => setMaxGradYear(e.target.value)}
                    placeholder="to"
                    className="glass-input flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Filter Info - Compact */}
          {(selectedCity || selectedState) && (
            <div className="glass-card px-4 py-3 mb-4 flex items-center justify-between border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white">
                  {selectedCity ? `${selectedCity}, ${selectedState}` : selectedState}
                </span>
                <span className="text-xs text-white/50">• {filteredUsers.length} found</span>
              </div>
              <button
                onClick={handleClearFilter}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          {/* Users Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-medium text-white/80">
                  {selectedCity || selectedState ? 'People in this area' : 'Directory'}
                </h3>
              </div>
              <span className="text-xs text-white/40">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
              </span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="glass-card p-8 text-center border border-white/5">
                <Search className="w-8 h-8 text-white/30 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-3">
                  {hasActiveFilters 
                    ? 'No people match your filters'
                    : selectedCity || selectedState 
                      ? 'No people in this area'
                      : 'No one in your network yet'
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearSearch}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {paginatedUsers.map((person) => (
                  <div
                    key={person.id}
                    className="group glass-card p-4 hover:scale-[1.01] transition-all duration-200 relative overflow-hidden border border-white/5 hover:border-rose-500/20"
                  >
                    <div className="relative z-10">
                      {/* Compact Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center ring-1 ring-white/10">
                            <span className="text-sm font-bold text-white">
                              {person.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm truncate">
                            {person.full_name}
                          </h4>
                          <p className="text-xs text-white/50 truncate">
                            {person.institutions?.name || 'University'} &apos;{String(person.grad_year).slice(-2)}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-3 min-h-[44px]">
                        {(person.status === 'employed' || person.status === 'internship') && (
                          <div className="flex items-start gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/80 font-medium line-clamp-1">
                                {person.job_title || 'Working'}
                              </p>
                              {person.show_employer !== false && person.employer && (
                                <p className="text-xs text-white/50 line-clamp-1">
                                  {person.employer}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {person.status === 'grad_school' && (
                          <div className="flex items-start gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/80 font-medium line-clamp-1">
                                {person.degree || ''} {person.program || 'Graduate Student'}
                              </p>
                              {person.show_school !== false && person.grad_school && (
                                <p className="text-xs text-white/50 line-clamp-1">
                                  {person.grad_school}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {person.status === 'looking' && (
                          <div className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <p className="text-xs text-white/80 font-medium">Looking for opportunities</p>
                          </div>
                        )}
                        {!person.status && (
                          <p className="text-xs text-white/30 italic">No status set</p>
                        )}
                      </div>

                      {/* Location & Tags Row */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {person.city && person.state && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-white/60">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {person.city}
                          </span>
                        )}
                        {person.looking_for_roommate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-pink-500/10 text-xs text-pink-300 border border-pink-500/20">
                            <HomeIcon className="w-3 h-3" />
                            Roommate
                          </span>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendMessage(person.id)}
                          className="flex-1 glass-button px-3 py-2 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Message
                        </button>
                        {(person.twitter_url || person.personal_website) && (
                          <div className="flex gap-1">
                            {person.twitter_url && (
                              <a
                                href={person.twitter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-light p-2 rounded-lg text-white/50 hover:text-sky-400 transition-colors"
                              >
                                <Twitter className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {person.personal_website && (
                              <a
                                href={person.personal_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-light p-2 rounded-lg text-white/50 hover:text-rose-400 transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination Controls - Compact */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="glass-light p-2 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                              currentPage === page
                                ? 'glass-button text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="glass-light p-2 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <span className="text-xs text-white/40 ml-2">
                      {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Network Insights - Bottom Section - EPIC REDESIGN */}
          {analytics.totalClassmates > 0 && (
            <div className="mt-16 sm:mt-24 relative">
              {/* Background glow effect */}
              <div className="absolute inset-0 -top-20 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-500/10 rounded-full blur-3xl" />
              </div>

              {/* Section Header */}
              <div className="text-center mb-10 sm:mb-12 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-medium text-white/70">Network Analytics</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                  {currentUser?.institutions?.name}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">Network</span>
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto">
                  {analytics.totalClassmates} alumni across {analytics.cities.length} cities
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
