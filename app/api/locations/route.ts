import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ABBREV_TO_STATE_NAME } from '@/lib/constants/location';

// Haversine formula to calculate distance between two lat/lng points in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's data
    const { data: currentUser } = await supabase
      .from('users')
      .select('institution_id, latitude, longitude')
      .eq('id', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const stateAbbrev = searchParams.get('state');
    const country = searchParams.get('country');

    // If country parameter is provided (non-US), return city-level data for that country
    if (country && country !== 'United States') {
      // Fetch all users in the country once
      const { data: countryUsers } = await supabase
        .from('users')
        .select('id, city, country, latitude, longitude, institution_id')
        .eq('onboarding_completed', true)
        .eq('profile_visible', true)
        .eq('country', country)
        .neq('id', user.id);

      if (!countryUsers || countryUsers.length === 0) {
        return NextResponse.json({
          locations: {},
          coordinates: {},
        });
      }

      // Filter to include: same institution OR within 50 miles
      const relevantUsers = countryUsers.filter(u => {
        // Include if same institution
        if (currentUser.institution_id && u.institution_id === currentUser.institution_id) {
          return true;
        }
        
        // Include if within 50 miles (80467 meters)
        if (currentUser.latitude && currentUser.longitude && u.latitude && u.longitude) {
          const distance = calculateDistance(
            currentUser.latitude,
            currentUser.longitude,
            u.latitude,
            u.longitude
          );
          return distance <= 80467;
        }
        
        return false;
      });

      if (relevantUsers.length === 0) {
        return NextResponse.json({
          locations: {},
          coordinates: {},
        });
      }

      // Aggregate by city
      const locationData: { [city: string]: number } = {};
      const coordinates: { [city: string]: [number, number] } = {};

      relevantUsers.forEach((u) => {
        if (u.city && u.latitude && u.longitude) {
          locationData[u.city] = (locationData[u.city] || 0) + 1;
          if (!coordinates[u.city]) {
            coordinates[u.city] = [u.longitude, u.latitude];
          }
        }
      });

      return NextResponse.json({
        locations: locationData,
        coordinates,
      });
    }

    // If state parameter is provided, return city-level data
    // This includes: institution members in that state + people within 50 miles of user
    if (stateAbbrev) {
      // Fetch all users in the state once
      const { data: stateUsers } = await supabase
        .from('users')
        .select('id, city, state, latitude, longitude, institution_id')
        .eq('onboarding_completed', true)
        .eq('profile_visible', true)
        .eq('state', stateAbbrev)
        .neq('id', user.id);

      if (!stateUsers || stateUsers.length === 0) {
        return NextResponse.json({
          locations: {},
          coordinates: {},
        });
      }

      // Filter to include: same institution OR within 50 miles
      const relevantUsers = stateUsers.filter(u => {
        // Include if same institution
        if (currentUser.institution_id && u.institution_id === currentUser.institution_id) {
          return true;
        }
        
        // Include if within 50 miles (80467 meters)
        if (currentUser.latitude && currentUser.longitude && u.latitude && u.longitude) {
          const distance = calculateDistance(
            currentUser.latitude,
            currentUser.longitude,
            u.latitude,
            u.longitude
          );
          return distance <= 80467;
        }
        
        return false;
      });

      if (relevantUsers.length === 0) {
        return NextResponse.json({
          locations: {},
          coordinates: {},
        });
      }

      // Aggregate by city
      const locationData: { [city: string]: number } = {};
      const coordinates: { [city: string]: [number, number] } = {};

      relevantUsers.forEach((u) => {
        if (u.city && u.latitude && u.longitude) {
          locationData[u.city] = (locationData[u.city] || 0) + 1;
          if (!coordinates[u.city]) {
            coordinates[u.city] = [u.longitude, u.latitude];
          }
        }
      });

      return NextResponse.json({
        locations: locationData,
        coordinates,
      });
    }

    // If country parameter is 'United States', return state-level data for USA
    if (country === 'United States') {
      if (!currentUser.institution_id) {
        return NextResponse.json({ 
          locations: {},
          coordinates: {},
          error: 'No institution found. Please complete onboarding.'
        });
      }

      const { data: institutionUsers } = await supabase
        .from('users')
        .select('state, country')
        .eq('institution_id', currentUser.institution_id)
        .eq('onboarding_completed', true)
        .eq('profile_visible', true)
        .eq('country', 'United States')
        .neq('id', user.id)
        .not('state', 'is', null);

      if (!institutionUsers || institutionUsers.length === 0) {
        return NextResponse.json({ locations: {}, coordinates: {} });
      }

      // Aggregate by state (convert abbreviations to full names for GeoJSON matching)
      const locationData: { [stateName: string]: number } = {};

      institutionUsers.forEach((u) => {
        if (u.state) {
          const stateName = ABBREV_TO_STATE_NAME[u.state] || u.state;
          locationData[stateName] = (locationData[stateName] || 0) + 1;
        }
      });

      return NextResponse.json({ 
        locations: locationData,
        coordinates: {} // Empty coordinates for state-level view
      });
    }

    // Otherwise (no params), return country-level data for users from the same institution
    if (!currentUser.institution_id) {
      return NextResponse.json({ 
        locations: {},
        coordinates: {},
        error: 'No institution found. Please complete onboarding.'
      });
    }

    const { data: institutionUsers } = await supabase
      .from('users')
      .select('country')
      .eq('institution_id', currentUser.institution_id)
      .eq('onboarding_completed', true)
      .eq('profile_visible', true)
      .neq('id', user.id)
      .not('country', 'is', null);

    if (!institutionUsers || institutionUsers.length === 0) {
      return NextResponse.json({ locations: {}, coordinates: {} });
    }

    // Aggregate by country (normalize country names for GeoJSON matching)
    const locationData: { [countryName: string]: number } = {};

    institutionUsers.forEach((u) => {
      if (u.country) {
        // Normalize country name to match GeoJSON
        let countryName = u.country;
        if (countryName === 'United States') {
          countryName = 'United States of America';
        } else if (countryName === 'UK' || countryName === 'United Kingdom') {
          countryName = 'United Kingdom';
        }
        locationData[countryName] = (locationData[countryName] || 0) + 1;
      }
    });

    return NextResponse.json({ 
      locations: locationData,
      coordinates: {} // Empty coordinates for country-level view
    });
  } catch (error) {
    console.error('Error in /api/locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
