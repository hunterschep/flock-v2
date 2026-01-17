import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { generateApiKey } from '@/lib/api/auth';
import { TIER_LIMITS, type ApiTier } from '@/lib/api/types';
import { isAdminEmail } from '@/lib/constants/admin';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  return isAdminEmail(user?.email);
}

// Get scopes based on tier
function getScopesForTier(tier: ApiTier): string[] {
  return TIER_LIMITS[tier]?.scopes || ['read:aggregates'];
}

// GET - List all API keys
export async function GET(_request: NextRequest) {
  if (!await isAdmin(_request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client to bypass RLS on api_keys/api_customers tables
  const supabase = createServiceRoleClient();
  
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select(`
      id,
      customer_id,
      name,
      key_prefix,
      scopes,
      environment,
      is_active,
      last_used_at,
      usage_count,
      created_at,
      api_customers (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }

  // Transform the data to include customer_name
  const transformedKeys = keys?.map(k => {
    // api_customers can be an object or array depending on the join
    const customer = Array.isArray(k.api_customers) 
      ? k.api_customers[0] 
      : k.api_customers;
    
    return {
      id: k.id,
      customer_id: k.customer_id,
      customer_name: (customer as { name?: string } | null)?.name || 'Unknown',
      name: k.name,
      key_prefix: k.key_prefix,
      scopes: k.scopes,
      environment: k.environment,
      is_active: k.is_active,
      last_used_at: k.last_used_at,
      usage_count: k.usage_count,
      created_at: k.created_at,
    };
  }) || [];

  return NextResponse.json({ keys: transformedKeys });
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customer_name, key_name, environment = 'production' } = body;

    if (!customer_name || !key_name) {
      return NextResponse.json(
        { error: 'Customer name and key name are required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS on api_keys/api_customers tables
    const supabase = createServiceRoleClient();

    // Create or find customer
    let customerId: string;
    let customerTier: ApiTier = 'starter';
    const slug = customer_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data: existingCustomer } = await supabase
      .from('api_customers')
      .select('id, tier')
      .eq('slug', slug)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      customerTier = existingCustomer.tier as ApiTier;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('api_customers')
        .insert({
          name: customer_name,
          slug,
          contact_name: 'Admin',
          contact_email: 'admin@example.com',
          tier: 'starter',
          status: 'active',
        })
        .select('id, tier')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.id;
      customerTier = newCustomer.tier as ApiTier;
    }

    // Get scopes based on customer tier
    const scopes = getScopesForTier(customerTier);

    // Generate the API key
    const { key, hash, prefix } = generateApiKey();

    // Insert the key with tier-appropriate scopes
    const { error: keyError } = await supabase
      .from('api_keys')
      .insert({
        customer_id: customerId,
        key_hash: hash,
        key_prefix: prefix,
        name: key_name,
        scopes,
        environment,
        is_active: true,
      });

    if (keyError) {
      console.error('Error creating API key:', keyError);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return the full key (only shown once)
    return NextResponse.json({
      success: true,
      key, // Full key - only returned once
      prefix,
      tier: customerTier,
      scopes,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    // Use service role client to bypass RLS on api_keys table
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', keyId);

    if (error) {
      console.error('Error revoking API key:', error);
      return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

