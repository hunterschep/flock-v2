'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  LogOut
} from 'lucide-react';
import { UnreadBadge } from '@/components/messaging/UnreadBadge';
import { getOrCreateConversation } from '@/lib/messaging/utils';
import { Footer } from '@/components/Footer';
import { CollegeLogo } from '@/components/CollegeLogo';

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
  instagram_url: string | null;
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
  const [searchName, setSearchName] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [searchJobTitle, setSearchJobTitle] = useState<string>('');
  const [searchCompany, setSearchCompany] = useState<string>('');
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
    if (selectedCity || selectedState || currentUser) {
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

      const { data: profile } = await supabase
        .from('users')
        .select(`*, institutions:institution_id (name, domain)`)
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
        .select(`*, institutions:institution_id (name, domain)`)
        .neq('id', user.id)
        .eq('profile_visible', true)
        .eq('onboarding_completed', true);

      if (selectedState) query = query.eq('state', selectedState);
      if (selectedCity) query = query.eq('city', selectedCity);

      const { data } = await query.order('created_at', { ascending: false }).limit(100);
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

  // Client-side filtering
  const filteredUsers = users.filter(user => {
    if (searchName && !user.full_name?.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchCity && !user.city?.toLowerCase().includes(searchCity.toLowerCase())) return false;
    if (searchJobTitle && !user.job_title?.toLowerCase().includes(searchJobTitle.toLowerCase())) return false;
    if (searchCompany && !user.employer?.toLowerCase().includes(searchCompany.toLowerCase())) return false;
    
    const hasStatusFilter = filterEmployed || filterInternship || filterGradSchool || filterLooking;
    if (hasStatusFilter) {
      const matchesStatus = 
        (filterEmployed && user.status === 'employed') ||
        (filterInternship && user.status === 'internship') ||
        (filterGradSchool && user.status === 'grad_school') ||
        (filterLooking && user.status === 'looking');
      if (!matchesStatus) return false;
    }
    
    if (minGradYear && user.grad_year < parseInt(minGradYear)) return false;
    if (maxGradYear && user.grad_year > parseInt(maxGradYear)) return false;
    if (filterRoommates && !user.looking_for_roommate) return false;
    
    return true;
  });

  const hasActiveFilters = searchName || searchCity || searchJobTitle || searchCompany || 
    filterRoommates || filterEmployed || filterInternship || filterGradSchool || 
    filterLooking || minGradYear || maxGradYear;

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchCity, searchJobTitle, searchCompany, filterRoommates, 
      filterEmployed, filterInternship, filterGradSchool, filterLooking, 
      minGradYear, maxGradYear, selectedCity, selectedState]);

  // Analytics
  const analytics = useMemo(() => {
    const sameInstitutionUsers = users.filter(u => 
      currentUser?.institutions?.name && u.institutions?.name === currentUser.institutions.name
    );

    const gradSchoolCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};

    sameInstitutionUsers.forEach(user => {
      if (user.status === 'grad_school' && user.grad_school) {
        gradSchoolCounts[user.grad_school] = (gradSchoolCounts[user.grad_school] || 0) + 1;
      }
      if (user.city && user.state) {
        const location = `${user.city}, ${user.state}`;
        cityCounts[location] = (cityCounts[location] || 0) + 1;
      }
      if ((user.status === 'employed' || user.status === 'internship') && user.employer) {
        companyCounts[user.employer] = (companyCounts[user.employer] || 0) + 1;
      }
    });

    return {
      gradSchools: Object.entries(gradSchoolCounts).sort(([,a], [,b]) => b - a).map(([name, count]) => ({ name, count })),
      cities: Object.entries(cityCounts).sort(([,a], [,b]) => b - a).map(([name, count]) => ({ name, count })),
      companies: Object.entries(companyCounts).sort(([,a], [,b]) => b - a).map(([name, count]) => ({ name, count })),
      totalClassmates: sameInstitutionUsers.length,
    };
  }, [users, currentUser]);

  // Status badge helper
  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'employed': return { icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      case 'internship': return { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'grad_school': return { icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' };
      case 'looking': return { icon: Search, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="main-content" className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {currentUser?.institutions?.domain && (
              <CollegeLogo 
                domain={currentUser.institutions.domain} 
                size="md"
                className="hidden sm:flex"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">Flock</h1>
              {currentUser && (
                <span className="text-xs text-white/50 hidden md:block">
                  {currentUser.institutions?.name} &apos;{String(currentUser.grad_year).slice(-2)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/messages"
              className="relative px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <MessageCircle className="w-5 h-5 md:hidden" />
              <span className="hidden md:inline">Messages</span>
              <UnreadBadge />
            </Link>
            <Link 
              href="/profile/edit"
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <span className="hidden md:inline">Edit Profile</span>
              <span className="md:hidden">Profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-all"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Map Section */}
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="w-full h-[400px] md:h-[500px]">
              <FlockMap onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="flex-1 px-4 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search by name..."
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
                />
              </div>
              
              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'employed', label: 'Employed', icon: Briefcase, active: filterEmployed, toggle: () => setFilterEmployed(!filterEmployed) },
                  { key: 'gradschool', label: 'Grad School', icon: GraduationCap, active: filterGradSchool, toggle: () => setFilterGradSchool(!filterGradSchool) },
                  { key: 'looking', label: 'Looking', icon: Search, active: filterLooking, toggle: () => setFilterLooking(!filterLooking) },
                  { key: 'roommates', label: 'Roommates', icon: HomeIcon, active: filterRoommates, toggle: () => setFilterRoommates(!filterRoommates) },
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={filter.toggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      filter.active 
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30' 
                        : 'bg-white/[0.03] text-white/60 border border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <filter.icon className="w-3 h-3" />
                    {filter.label}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearSearch}
                  className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-light)] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Advanced filters */}
            <details className="mt-3 group">
              <summary className="text-xs text-white/40 hover:text-white/60 cursor-pointer list-none flex items-center gap-1">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                More filters
              </summary>
              <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="City" className="glass-input px-3 py-2 rounded-lg text-sm w-full" />
                <input type="text" value={searchJobTitle} onChange={(e) => setSearchJobTitle(e.target.value)} placeholder="Job Title" className="glass-input px-3 py-2 rounded-lg text-sm w-full" />
                <input type="text" value={searchCompany} onChange={(e) => setSearchCompany(e.target.value)} placeholder="Company" className="glass-input px-3 py-2 rounded-lg text-sm w-full" />
                <div className="flex items-center gap-2 w-full">
                  <input type="number" value={minGradYear} onChange={(e) => setMinGradYear(e.target.value)} placeholder="From" className="glass-input flex-1 min-w-0 px-2 py-2 rounded-lg text-sm" />
                  <span className="text-white/20 shrink-0">-</span>
                  <input type="number" value={maxGradYear} onChange={(e) => setMaxGradYear(e.target.value)} placeholder="To" className="glass-input flex-1 min-w-0 px-2 py-2 rounded-lg text-sm" />
                </div>
              </div>
            </details>
          </div>

          {/* Location filter indicator */}
          {(selectedCity || selectedState) && (
            <div className="glass-card rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-sm text-white">{selectedCity ? `${selectedCity}, ${selectedState}` : selectedState}</span>
                <span className="text-xs text-white/40">• {filteredUsers.length} found</span>
              </div>
              <button onClick={handleClearFilter} className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-light)] flex items-center gap-1 cursor-pointer">
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          {/* Grid header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-medium text-white/70">Directory</h2>
            </div>
            <span className="text-xs text-white/40">{filteredUsers.length} people</span>
          </div>

          {/* Users grid */}
          {filteredUsers.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/50">
                {hasActiveFilters ? 'No people match your filters' : 'No one in your network yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginatedUsers.map((person) => {
                  const statusStyle = getStatusStyle(person.status);
                  
                  return (
                    <div 
                      key={person.id} 
                      className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl transition-all duration-200 overflow-hidden"
                    >
                      {/* Status accent bar */}
                      {statusStyle && (
                        <div className={`absolute top-0 left-0 right-0 h-0.5 ${statusStyle.bg.replace('/10', '/40')}`} />
                      )}
                      
                      <div className="p-4">
                        {/* Header with avatar and actions */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 flex items-center justify-center ring-1 ring-white/[0.08]">
                                <span className="text-base font-semibold text-[var(--color-accent)]">
                                  {person.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {/* Online indicator or status dot */}
                              {statusStyle && (
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${statusStyle.bg} border-2 border-[var(--color-bg)] flex items-center justify-center`}>
                                  <statusStyle.icon className={`w-2 h-2 ${statusStyle.color}`} />
                                </div>
                              )}
                            </div>
                            
                            {/* Name & school */}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-white text-sm truncate leading-tight">{person.full_name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {person.institutions?.domain && (
                                  <CollegeLogo 
                                    domain={person.institutions.domain} 
                                    size="sm"
                                    className="!w-4 !h-4 !rounded"
                                  />
                                )}
                                <p className="text-xs text-white/40 truncate">
                                  &apos;{String(person.grad_year).slice(-2)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick actions - compact */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleSendMessage(person.id)}
                              className="p-2 rounded-lg text-white/40 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all"
                              title="Send message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Status & role info */}
                        {statusStyle && (
                          <div className={`${statusStyle.bg} ${statusStyle.border} border rounded-lg px-3 py-2 mb-3`}>
                            <p className="text-xs font-medium text-white truncate">
                              {person.status === 'grad_school' 
                                ? `${person.degree || ''} ${person.program || 'Graduate Student'}`.trim()
                                : person.status === 'looking'
                                ? 'Open to opportunities'
                                : person.job_title || (person.status === 'internship' ? 'Intern' : 'Working')
                              }
                            </p>
                            {((person.status === 'employed' || person.status === 'internship') && person.show_employer !== false && person.employer) && (
                              <p className="text-xs text-white/50 truncate mt-0.5">{person.employer}</p>
                            )}
                            {(person.status === 'grad_school' && person.show_school !== false && person.grad_school) && (
                              <p className="text-xs text-white/50 truncate mt-0.5">{person.grad_school}</p>
                            )}
                          </div>
                        )}

                        {/* Footer: location & tags */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {person.city && person.state && (
                              <span className="inline-flex items-center gap-1 text-xs text-white/40 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{person.city}, {person.state}</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {person.looking_for_roommate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[10px] font-medium text-[var(--color-accent)]">
                                <HomeIcon className="w-2.5 h-2.5" />
                                Roommate
                              </span>
                            )}
                            {person.linkedin_url && (
                              <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-blue-400 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </a>
                            )}
                            {person.twitter_url && (
                              <a href={person.twitter_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-sky-400 transition-colors">
                                <Twitter className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {person.personal_website && (
                              <a href={person.personal_website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-white/30 hover:text-white transition-colors">
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60 disabled:opacity-30 hover:bg-white/[0.05] transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
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
                    className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60 disabled:opacity-30 hover:bg-white/[0.05] transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <span className="text-xs text-white/30 ml-2">
                    {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Network Analytics */}
          {analytics.totalClassmates > 0 && (
            <div className="mt-20 mb-8">
              {/* Section header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Network Insights
                  </h2>
                  <p className="text-sm text-white/40">
                    Where {currentUser?.institutions?.name} alumni are today
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <Users className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-sm text-white font-medium">{analytics.totalClassmates}</span>
                  <span className="text-sm text-white/40">alumni</span>
                </div>
              </div>

              {/* Bento grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                {/* Main stat */}
                <div className="col-span-2 row-span-2 glass-card rounded-xl p-6 md:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-accent)]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/60">Top Destination</div>
                        <div className="text-lg md:text-xl font-bold text-white">{analytics.cities[0]?.name || 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-3xl md:text-4xl font-bold text-white">{analytics.cities.length}</div>
                        <div className="text-xs text-white/40">Cities worldwide</div>
                      </div>
                      <div>
                        <div className="text-3xl md:text-4xl font-bold text-white">{analytics.cities[0]?.count || 0}</div>
                        <div className="text-xs text-white/40">In top city</div>
                      </div>
                    </div>

                    {/* Mini bar chart */}
                    <div className="mt-6 flex items-end gap-1 h-16">
                    {analytics.cities.slice(0, 8).map((city) => (
                        <div 
                          key={city.name}
                          className="flex-1 bg-[var(--color-accent)] rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ height: `${Math.max(8, (city.count / (analytics.cities[0]?.count || 1)) * 100)}%` }}
                          title={`${city.name}: ${city.count}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Companies stat */}
                <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-auto">
                    <Briefcase className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{analytics.companies.length}</div>
                    <div className="text-xs text-white/40">Companies</div>
                  </div>
                </div>

                {/* Grad schools stat */}
                <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-auto">
                    <GraduationCap className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{analytics.gradSchools.length}</div>
                    <div className="text-xs text-white/40">Grad Schools</div>
                  </div>
                </div>

                {/* Top company */}
                <div className="col-span-2 glass-card rounded-xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/40 mb-0.5">Top Employer</div>
                    <div className="text-base font-semibold text-white truncate">{analytics.companies[0]?.name || 'N/A'}</div>
                    <div className="text-xs text-emerald-400">{analytics.companies[0]?.count || 0} alumni</div>
                  </div>
                </div>
              </div>

              {/* Lists section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Companies list */}
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium text-white text-sm">Where Alumni Work</span>
                    </div>
                    <span className="text-xs text-white/30">{analytics.companies.length} companies</span>
                  </div>
                  {analytics.companies.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.companies.slice(0, 5).map((company, idx) => {
                        const percentage = (company.count / analytics.companies[0].count) * 100;
                        return (
                          <div key={company.name} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-white/30 w-4">{idx + 1}</span>
                                <span className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">{company.name}</span>
                              </div>
                              <span className="text-xs text-white/50 tabular-nums">{company.count}</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 text-center py-8">No data yet</p>
                  )}
                </div>

                {/* Grad schools list */}
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-violet-400" />
                      <span className="font-medium text-white text-sm">Graduate Studies</span>
                    </div>
                    <span className="text-xs text-white/30">{analytics.gradSchools.length} schools</span>
                  </div>
                  {analytics.gradSchools.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.gradSchools.slice(0, 5).map((school, idx) => {
                        const percentage = (school.count / analytics.gradSchools[0].count) * 100;
                        return (
                          <div key={school.name} className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-white/30 w-4">{idx + 1}</span>
                                <span className="text-sm text-white truncate group-hover:text-violet-400 transition-colors">{school.name}</span>
                              </div>
                              <span className="text-xs text-white/50 tabular-nums">{school.count}</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-500/60 to-violet-400/40 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 text-center py-8">No data yet</p>
                  )}
                </div>
              </div>

              {/* Clickable cities */}
              {analytics.cities.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/40">Click to filter by city</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analytics.cities.slice(0, 12).map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          const parts = city.name.split(', ');
                          if (parts.length === 2) {
                            setSelectedCity(parts[0]);
                            setSelectedState(parts[1]);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-white/60 hover:bg-white/[0.04] hover:border-white/10 hover:text-white transition-all cursor-pointer"
                      >
                        {city.name}
                        <span className="ml-1.5 text-white/30">{city.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
